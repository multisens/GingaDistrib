package config

import (
	"fmt"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

const (
	Directory         = "./dash"
	Porta             = ":8083"
	SegmentDurationUs = 2000000
	EventScheme       = "urn:test:event"
	EventValue        = "loop-events"
)

var (
	MQTTClient mqtt.Client
)

// InitMQTT conecta a aplicação ao Broker MQTT.
// O callback onConnect é executado após a conexão
// inicial e também após reconexões automáticas.
func InitMQTT(
	brokerURL string,
	clientID string,
	onConnect mqtt.OnConnectHandler,
) error {
	opts := mqtt.NewClientOptions().
		AddBroker(brokerURL).
		SetClientID(clientID)

	opts.SetAutoReconnect(true)
	opts.SetConnectRetry(true)

	if onConnect != nil {
		opts.SetOnConnectHandler(onConnect)
	}

	MQTTClient = mqtt.NewClient(opts)

	token := MQTTClient.Connect()
	token.Wait()

	if err := token.Error(); err != nil {
		return fmt.Errorf("falha ao conectar ao MQTT: %w", err)
	}

	fmt.Println("✅ [MQTT] Conectado ao Broker")
	return nil
}
