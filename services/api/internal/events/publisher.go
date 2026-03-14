package events

import (
	"encoding/json"
	"log"
	"os"

	"github.com/nats-io/nats.go"
)

// Publisher publishes events to NATS subjects.
// Publish is always fire-and-forget — errors are logged but never
// returned to the caller so a NATS hiccup never fails an API request.
type Publisher interface {
	Publish(subject string, payload any)
	Close()
}

type natsPublisher struct {
	conn *nats.Conn
}

func NewPublisher() Publisher {
	url := os.Getenv("NATS_URL")
	if url == "" {
		url = nats.DefaultURL // nats://localhost:4222
	}

	conn, err := nats.Connect(url)
	if err != nil {
		log.Printf("[events] NATS connect failed (%s): %v — publishing disabled", url, err)
		return &noopPublisher{}
	}

	log.Printf("[events] connected to NATS at %s", url)
	return &natsPublisher{conn: conn}
}

func (p *natsPublisher) Publish(subject string, payload any) {
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[events] marshal error on subject %q: %v", subject, err)
		return
	}
	if err := p.conn.Publish(subject, data); err != nil {
		log.Printf("[events] publish error on subject %q: %v", subject, err)
	}
}

func (p *natsPublisher) Close() {
	p.conn.Drain()
}

// noopPublisher is used when NATS is unavailable — API keeps running.
type noopPublisher struct{}

func (n *noopPublisher) Publish(subject string, payload any) {}
func (n *noopPublisher) Close()                              {}
