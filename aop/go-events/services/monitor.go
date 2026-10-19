package services

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"go-events/config"
	"go-events/models"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

var (
	Mutex                sync.RWMutex
	CurrentGlobalSegment int
	SegmentsPerLoop      int
	Events               []models.Evento
	ActiveEvents         map[int]bool = make(map[int]bool)
)

// Estrutura direta para ler o JSON dos eventos do MPD
type EventEnvelope struct {
	SegStart int `json:"seg_start"`
	SegEnd   int `json:"seg_end"`
	Action   struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Color       []int  `json:"color"`
	} `json:"action"`
}

// Estrutura para ler a rota /dash/current-chunk
type CurrentChunkResponse struct {
	Chunk int `json:"chunk"`
}

// 1. FetchAndParseMPD: Baixa o MPD e extrai os eventos do XML
func FetchAndParseMPD(mpdURL string) error {
	resp, err := http.Get(mpdURL)
	if err != nil {
		return fmt.Errorf("HTTP error fetching MPD: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error reading MPD response body: %w", err)
	}

	var mpd models.MPD
	if err := xml.Unmarshal(body, &mpd); err != nil {
		return fmt.Errorf("error parsing MPD XML: %w", err)
	}

	// Define os segmentos por loop
	loopSegments := 60
	if mpd.Period.EventStream.MaxSegment > 0 {
		loopSegments = mpd.Period.EventStream.MaxSegment
	} else if mpd.Period.EventStream.LastSegment > 0 {
		loopSegments = mpd.Period.EventStream.LastSegment
	}

	var newEvents []models.Evento

	for _, item := range mpd.Period.EventStream.EventItems {
		var env EventEnvelope
		if err := json.Unmarshal([]byte(strings.TrimSpace(item.Data)), &env); err == nil {
			segStart := env.SegStart
			if segStart == 0 {
				segStart = item.SegStart
			}
			segEnd := env.SegEnd
			if segEnd == 0 {
				segEnd = item.SegEnd
			}

			newEvents = append(newEvents, models.Evento{
				SegStart: segStart,
				SegEnd:   segEnd,
				Name:     env.Action.Name,
				Desc:     env.Action.Description,
				Color:    env.Action.Color,
			})
		}
	}

	Mutex.Lock()
	SegmentsPerLoop = loopSegments
	Events = newEvents
	ActiveEvents = make(map[int]bool) // Reseta estado de eventos ativos
	Mutex.Unlock()

	fmt.Printf("✅ [AoP] %d events extracted! (Loop = %d)\n", len(newEvents), loopSegments)
	return nil
}

// 2. WatchSegmentsHTTP: Monitora a rota /current-chunk em intervalos regulares
func WatchSegmentsHTTP(ctx context.Context, baseURL string) {
	client := &http.Client{Timeout: 2 * time.Second}

	baseURL = strings.TrimRight(baseURL, "/")
	if !strings.HasSuffix(baseURL, "/dash") {
		baseURL += "/dash"
	}
	endpoint := baseURL + "/current-chunk"

	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	lastChunk := -1
	fmt.Println("👀 [DASH] Monitoring:", endpoint)

	for {
		select {
		case <-ctx.Done():
			fmt.Println("⏹️ [DASH] Monitoring canceled")
			return

		case <-ticker.C:
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
			if err != nil {
				continue
			}

			resp, err := client.Do(req)
			if err != nil {
				continue
			}

			var data CurrentChunkResponse
			err = json.NewDecoder(resp.Body).Decode(&data)
			resp.Body.Close()

			if err != nil || data.Chunk <= 0 || data.Chunk == lastChunk {
				continue
			}

			// Novo chunk detectado
			lastChunk = data.Chunk

			Mutex.Lock()
			total := SegmentsPerLoop
			if total <= 0 {
				total = 60
			}

			relativeSegment := ((data.Chunk - 1) % total) + 1
			CurrentGlobalSegment = data.Chunk

			fmt.Printf("📦 [DASH] Chunk: %d | Relative: %d\n", data.Chunk, relativeSegment)

			checkAndPublishEvents(relativeSegment)
			Mutex.Unlock()
		}
	}
}

// 3. checkAndPublishEvents: Dispara o evento via MQTT se estiver no segmento certo
func checkAndPublishEvents(relativeSegment int) {
	for i, evt := range Events {
		// Se está dentro da janela do evento
		if relativeSegment >= evt.SegStart && relativeSegment <= evt.SegEnd {
			if !ActiveEvents[i] {
				ActiveEvents[i] = true

				payload, _ := json.Marshal(models.EventPayload{
					Name:        evt.Name,
					Description: evt.Desc,
					Color:       evt.Color,
					SegStart:    evt.SegStart,
					SegEnd:      evt.SegEnd,
				})

				topic := "video/event"
				fmt.Printf("🚀 [AoP -> MQTT] Event on segment %d: %s\n", relativeSegment, string(payload))

				if config.MQTTClient != nil && config.MQTTClient.IsConnected() {
					config.MQTTClient.Publish(topic, 0, false, payload)
				}
			}
		} else {
			// Saiu da janela do evento, permite ser disparado no próximo loop
			delete(ActiveEvents, i)
		}
	}
}
