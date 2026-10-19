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
	watcherID     uint64
)

func main() {
	opts := mqtt.NewClientOptions().
		AddBroker("tcp://localhost:1883").
		SetClientID("aop-receiver-go").
		SetAutoReconnect(true)

	opts.SetOnConnectHandler(func(client mqtt.Client) {
		fmt.Println("✅ [AoP] Connected to MQTT Broker!")
		fmt.Println("👀 [AoP] Waiting for video URLs...")

		topics := []string{
			"aop/display/layers/video/url",
			"video/url",
		}

		for _, topic := range topics {
			token := client.Subscribe(
				topic,
				1,
				handleVideoURL,
			)

			token.Wait()

			if err := token.Error(); err != nil {
				log.Printf(
					"❌ Subscribe %s: %v",
					topic,
					err,
				)
			}
		}
	})

	config.MQTTClient = mqtt.NewClient(opts)

	token := config.MQTTClient.Connect()
	token.Wait()

	if err := token.Error(); err != nil {
		log.Printf("❌ MQTT connection error: %v", err)
	}

	select {}
}

func handleVideoURL(
	client mqtt.Client,
	msg mqtt.Message,
) {
	rawPayload := strings.TrimSpace(
		string(msg.Payload()),
	)

	fmt.Printf(
		"\n📨 [MQTT] Topic: %s | Payload: %q\n",
		msg.Topic(),
		rawPayload,
	)

	if rawPayload == "" {
		return
	}

	newURL := normalizeURL(rawPayload)

	mu.Lock()
	defer mu.Unlock()

	if newURL == currentURL {
		return
	}

	// Cancela o watcher anterior.
	if cancelWatcher != nil {
		fmt.Println("🛑 [AoP] Stopping previous monitor...")
		cancelWatcher()
		cancelWatcher = nil
	}

	currentURL = newURL
	watcherID++

	parsedURL, err := url.Parse(newURL)

	if err != nil ||
		!strings.HasSuffix(
			strings.ToLower(parsedURL.Path),
			".mpd",
		) {

		fmt.Println("⏹️ [AoP] Non-DASH video detected")
		return
	}

	ctx, cancel := context.WithCancel(
		context.Background(),
	)

	cancelWatcher = cancel
	id := watcherID

	go func() {
		services.WatchSegmentsMPD(ctx, newURL)

		mu.Lock()
		if watcherID == id {
			cancelWatcher = nil
		}
		mu.Unlock()
	}()
}

func normalizeURL(rawPayload string) string {
	if strings.HasPrefix(rawPayload, "http://") ||
		strings.HasPrefix(rawPayload, "https://") {
		return rawPayload
	}

	baseExpress := "http://localhost:8081/live/dash"

	if strings.HasPrefix(
		rawPayload,
		"/videoStreamProxy/",
	) {
		file := strings.TrimPrefix(
			rawPayload,
			"/videoStreamProxy/",
		)

		return fmt.Sprintf("%s/%s", baseExpress, file)
	}

	cleanPath := strings.TrimLeft(rawPayload, "/")

	return fmt.Sprintf(
		"http://localhost:8081/live/%s",
		cleanPath,
	)
}
