package main

import (
	"context"
	"fmt"
	"go-events/config"
	"go-events/services"
	"log"
	"net/url"
	"strings"
	"sync"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

var (
	mu            sync.Mutex
	cancelWatcher context.CancelFunc
	currentURL    string
)

func main() {
	opts := mqtt.NewClientOptions().
		AddBroker("tcp://localhost:1883").
		SetClientID("aop-receiver-go").
		SetAutoReconnect(true)

	// Callback acionada ao conectar no broker MQTT
	opts.SetOnConnectHandler(func(client mqtt.Client) {
		fmt.Println("✅ [AoP] Connected to MQTT Broker successfully!")
		fmt.Println("👀 [AoP] Waiting for messages on video topic...")

		// Subscrição nos tópicos de URL do vídeo
		client.Subscribe("aop/display/layers/video/url", 1, handleVideoURL)
		client.Subscribe("video/url", 1, handleVideoURL)
	})

	config.MQTTClient = mqtt.NewClient(opts)
	if err := config.MQTTClient.Connect().Wait(); config.MQTTClient.Connect().Error() != nil {
		log.Printf("⚠️ [AoP] Error connecting to MQTT: %v", err)
	}

	// Mantém o processo em execução contínua
	select {}
}

func handleVideoURL(client mqtt.Client, msg mqtt.Message) {
	rawPayload := strings.TrimSpace(string(msg.Payload()))
	fmt.Printf("\n📨 [MQTT] Topic: %s | Payload: %q\n", msg.Topic(), rawPayload)

	if rawPayload == "" {
		return
	}

	newURL := normalizeURL(rawPayload)

	mu.Lock()
	defer mu.Unlock()

	// Se for a mesma URL já em reprodução, ignora
	if newURL == currentURL {
		return
	}

	// 1. Sempre cancela e interrompe qualquer monitoramento DASH anterior
	if cancelWatcher != nil {
		fmt.Println("🛑 [AoP] Stopping previous DASH monitoring...")
		cancelWatcher()
		cancelWatcher = nil
	}

	currentURL = newURL

	// 2. Se for HLS (.m3u8) ou outro formato que não seja .mpd, encerra o fluxo do DASH
	if !strings.HasSuffix(strings.ToLower(newURL), ".mpd") {
		fmt.Printf("⏹️ [AoP] New format detected (%s). DASH monitor stopped.\n", newURL)
		return
	}

	// 3. Se for DASH (.mpd), cria um novo contexto e inicia o monitoramento
	ctx, cancel := context.WithCancel(context.Background())
	cancelWatcher = cancel

	go processDASHStream(ctx, newURL)
}

func processDASHStream(ctx context.Context, mpdURL string) {
	fmt.Printf("📥 [AoP] Fetching MPD manifest: %s\n", mpdURL)

	if err := services.FetchAndParseMPD(mpdURL); err != nil {
		log.Printf("❌ [AoP] Error processing MPD: %v", err)
		return
	}

	if ctx.Err() != nil {
		return
	}

	baseURL := extractBaseURL(mpdURL)

	fmt.Println("🚀 [AoP] Starting DASH segment monitoring...")
	services.WatchSegmentsHTTP(ctx, baseURL)
}

// Normaliza URLs relativas enviadas pelo broker para o servidor Express local
func normalizeURL(rawPayload string) string {
	if strings.HasPrefix(rawPayload, "http://") || strings.HasPrefix(rawPayload, "https://") {
		return rawPayload
	}

	baseExpress := "http://localhost:8081/live/dash"
	if strings.HasPrefix(rawPayload, "/videoStreamProxy/") {
		file := strings.TrimPrefix(rawPayload, "/videoStreamProxy/")
		return fmt.Sprintf("%s/%s", baseExpress, file)
	}

	cleanPath := strings.TrimLeft(rawPayload, "/")
	return fmt.Sprintf("http://localhost:8081/live/%s", cleanPath)
}

// Extrai o caminho base do diretório removendo o nome do arquivo final
func extractBaseURL(rawURL string) string {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "http://localhost:8081/live/dash"
	}
	idx := strings.LastIndex(parsed.Path, "/")
	if idx != -1 {
		return fmt.Sprintf("%s://%s%s", parsed.Scheme, parsed.Host, parsed.Path[:idx])
	}
	return fmt.Sprintf("%s://%s", parsed.Scheme, parsed.Host)
}
