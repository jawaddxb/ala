.PHONY: dev dev-bg stop status logs build clean

# Development
dev:
	npm run dev

dev-bg:
	@echo "Starting ALA dev server in background..."
	@nohup npm run dev > /tmp/ala-dev.log 2>&1 & echo $$! > /tmp/ala-dev.pid
	@echo "Started with PID $$(cat /tmp/ala-dev.pid)"
	@echo "View logs: make logs"

stop:
	@if [ -f /tmp/ala-dev.pid ]; then \
		kill $$(cat /tmp/ala-dev.pid) 2>/dev/null || true; \
		rm -f /tmp/ala-dev.pid; \
		echo "Stopped"; \
	else \
		echo "No PID file found"; \
	fi

status:
	@if [ -f /tmp/ala-dev.pid ] && kill -0 $$(cat /tmp/ala-dev.pid) 2>/dev/null; then \
		echo "Running (PID $$(cat /tmp/ala-dev.pid))"; \
	else \
		echo "Not running"; \
	fi

logs:
	@tail -f /tmp/ala-dev.log

# Build
build:
	npm run build

# Clean
clean:
	rm -rf .next node_modules
