package services

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"go-events/config"
	"go-events/models"
	"net/http"
	"strings"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type DASHSession struct {
	CurrentGlobalSegment int
	SegmentsPerLoop      int

	Events       []models.Evento
	ActiveEvents map[string]bool
}

func NewDASHSession() *DASHSession {
	return &DASHSession{
		ActiveEvents: make(map[string]bool),
	}
}

// Busca uma versão atualizada do MPD.
func FetchMPD(
	ctx context.Context,
	client *http.Client,
	mpdURL string,
) (*models.MPD, error) {

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		mpdURL,
		nil,
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Pragma", "no-cache")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(
			"HTTP status %d",
			resp.StatusCode,
		)
	}

	var mpd models.MPD

	if err := xml.NewDecoder(resp.Body).Decode(&mpd); err != nil {
		return nil, fmt.Errorf(
			"erro ao interpretar MPD: %w",
			err,
		)
	}

	return &mpd, nil
}

func getVideoTemplate(mpd *models.MPD) (models.SegmentTemplate, error) {
	for _, adaptation := range mpd.Period.AdaptationSets {
		if adaptation.ContentType != "" &&
			adaptation.ContentType != "video" {
			continue
		}

		for _, representation := range adaptation.Representations {
			template := representation.SegmentTemplate

			// Alguns MPDs colocam o SegmentTemplate
			// diretamente no AdaptationSet.
			if template.StartNumber == 0 {
				template = adaptation.SegmentTemplate
			}

			if template.StartNumber > 0 &&
				len(template.SegmentTimeline.Segments) > 0 {
				return template, nil
			}
		}
	}

	return models.SegmentTemplate{},
		fmt.Errorf("SegmentTemplate de vídeo não encontrado")
}

// Calcula o último chunk anunciado pelo manifesto.
func GetLatestChunk(mpd *models.MPD) (int, error) {
	template, err := getVideoTemplate(mpd)
	if err != nil {
		return 0, err
	}

	latest := template.StartNumber - 1

	for _, segment := range template.SegmentTimeline.Segments {
		if segment.Repeat < 0 {
			return 0, fmt.Errorf("r negativo não suportado")
		}

		latest += segment.Repeat + 1
	}

	return latest, nil
}

// Gera uma chave estável para cada evento.
func eventKey(evt models.Evento) string {
	return fmt.Sprintf(
		"%d:%d:%s:%s",
		evt.SegStart,
		evt.SegEnd,
		evt.Name,
		evt.Desc,
	)
}

// Atualiza os eventos presentes no MPD.
// Não reinicializa ActiveEvents a cada consulta.
func (s *DASHSession) LoadEvents(
	mpd *models.MPD,
) error {

	stream := mpd.Period.EventStream

	events := make([]models.Evento, 0, len(stream.EventItems))
	maxEnd := 0

	for _, item := range stream.EventItems {
		var payload models.MPDEventPayload

		if err := json.Unmarshal(
			[]byte(strings.TrimSpace(item.Data)),
			&payload,
		); err != nil {
			fmt.Printf(
				"⚠️ [EVENT] ID %s: JSON inválido: %v\n",
				item.ID,
				err,
			)
			continue
		}

		start := payload.SegStart
		end := payload.SegEnd

		// Fallback para atributos XML.
		if start == 0 && item.SegStart != 0 {
			start = item.SegStart
		}

		if end == 0 && item.SegEnd != 0 {
			end = item.SegEnd
		}

		// Convenção: início inclusivo, fim exclusivo.
		if start < 0 || end <= start {
			fmt.Printf(
				"⚠️ [EVENT] ID %s: intervalo inválido [%d,%d)\n",
				item.ID,
				start,
				end,
			)
			continue
		}

		if end > maxEnd {
			maxEnd = end
		}

		events = append(events, models.Evento{
			SegStart: start,
			SegEnd:   end,
			Name:     payload.Action.Name,
			Desc:     payload.Action.Description,
			Color:    payload.Action.Color,
		})
	}

	// ATENÇÃO:
	// Este valor precisa representar o número REAL
	// de chunks em cada repetição do vídeo.
	//
	// Se maxSegment não for confiável, não podemos
	// deduzir esse total apenas pelo último evento.
	total := stream.LastSegment

	if total <= 0 {
		return fmt.Errorf(
			"total de chunks por loop não configurado",
		)
	}

	// Preserva eventos ativos que ainda existem.
	validKeys := make(map[string]bool)

	for _, evt := range events {
		validKeys[eventKey(evt)] = true
	}

	for key := range s.ActiveEvents {
		if !validKeys[key] {
			delete(s.ActiveEvents, key)
		}
	}

	s.Events = events
	s.SegmentsPerLoop = total

	return nil
}

// Envia um evento e aguarda confirmação do broker.
//
// QoS 1 confirma o recebimento pelo broker,
// não necessariamente pelo consumidor final.
func publishEvent(
	ctx context.Context,
	payload []byte,
) error {

	if config.MQTTClient == nil ||
		!config.MQTTClient.IsConnected() {
		return fmt.Errorf("MQTT desconectado")
	}

	token := config.MQTTClient.Publish(
		"video/event",
		1,
		false,
		payload,
	)

	for {
		if token.WaitTimeout(100 * time.Millisecond) {
			return token.Error()
		}

		if ctx.Err() != nil {
			return ctx.Err()
		}
	}
}

// Processa os eventos para o segmento atual.
func (s *DASHSession) checkAndPublishEvents(
	ctx context.Context,
	relativeSegment int,
) {
	for _, evt := range s.Events {
		if ctx.Err() != nil {
			return
		}

		key := eventKey(evt)

		inside := relativeSegment >= evt.SegStart &&
			relativeSegment < evt.SegEnd

		if !inside {
			delete(s.ActiveEvents, key)
			continue
		}

		if s.ActiveEvents[key] {
			continue
		}

		payload, err := json.Marshal(models.EventPayload{
			Name:        evt.Name,
			Description: evt.Desc,
			Color:       evt.Color,
			SegStart:    evt.SegStart,
			SegEnd:      evt.SegEnd,
		})

		if err != nil {
			fmt.Printf(
				"❌ [EVENT] Erro ao serializar %s: %v\n",
				evt.Name,
				err,
			)
			continue
		}

		fmt.Printf(
			"🎯 [EVENT] Detectado: %s | Chunk relativo: %d | Intervalo: [%d,%d)\n",
			evt.Name,
			relativeSegment,
			evt.SegStart,
			evt.SegEnd,
		)

		if err := publishEvent(ctx, payload); err != nil {
			fmt.Printf(
				"❌ [MQTT] Falha ao publicar %s: %v\n",
				evt.Name,
				err,
			)
			continue
		}

		s.ActiveEvents[key] = true

		fmt.Printf(
			"✅ [MQTT] Publicação confirmada: %s\n",
			string(payload),
		)
	}
}

// Consulta o MPD a cada segundo.
func WatchSegmentsMPD(
	ctx context.Context,
	mpdURL string,
) {
	client := &http.Client{
		Timeout: 3 * time.Second,
	}

	session := NewDASHSession()

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	lastChunk := -1

	fmt.Println("👀 [DASH] Monitoring:", mpdURL)

	check := func() {
		mpd, err := FetchMPD(ctx, client, mpdURL)
		if err != nil {
			if ctx.Err() == nil {
				fmt.Println("❌ [DASH] MPD fetch:", err)
			}
			return
		}

		if ctx.Err() != nil {
			return
		}

		// Atualiza eventos em todas as consultas.
		if err := session.LoadEvents(mpd); err != nil {
			fmt.Println("❌ [DASH] Eventos:", err)
			return
		}

		latestChunk, err := GetLatestChunk(mpd)
		if err != nil {
			fmt.Println("❌ [DASH] Último chunk:", err)
			return
		}

		if latestChunk == lastChunk {
			return
		}

		if lastChunk >= 0 && latestChunk < lastChunk {
			fmt.Println("🔄 [DASH] Stream reiniciado")
			session.ActiveEvents = make(map[string]bool)
			lastChunk = -1
		}

		firstChunk := lastChunk + 1

		// Na primeira consulta, sincroniza com o
		// chunk atual, sem reproduzir todo o histórico.
		if lastChunk == -1 {
			firstChunk = latestChunk
		}

		if latestChunk > firstChunk {
			fmt.Printf(
				"⚠️ [DASH] MPD avançou %d chunks; processando intermediários\n",
				latestChunk-firstChunk+1,
			)
		}

		total := session.SegmentsPerLoop

		for chunk := firstChunk; chunk <= latestChunk; chunk++ {
			if ctx.Err() != nil {
				return
			}

			// Convenção zero-based: 0 até total-1.
			relativeSegment := (chunk - 1) % total

			session.CurrentGlobalSegment = chunk

			fmt.Printf(
				"📦 [DASH] Chunk global=%d | relativo=%d\n",
				chunk,
				relativeSegment,
			)

			session.checkAndPublishEvents(
				ctx,
				relativeSegment,
			)
		}

		lastChunk = latestChunk
	}

	// Primeira leitura imediata.
	check()

	for {
		select {
		case <-ctx.Done():
			fmt.Println("⏹️ [DASH] Monitoring stopped")
			return

		case <-ticker.C:
			check()
		}
	}
}

// Referência explícita ao pacote MQTT para facilitar
// eventual extensão com tokens e handlers.
var _ mqtt.Token
