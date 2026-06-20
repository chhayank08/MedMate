/**
 * Next.js instrumentation hook — runs once on server startup.
 * Registers OpenTelemetry tracing and exports to Arize Phoenix cloud
 * when PHOENIX_API_KEY + OTEL_EXPORTER_OTLP_ENDPOINT are set.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerOTel } = await import("@vercel/otel");

    const exporterEndpoint =
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      (process.env.PHOENIX_API_KEY
        ? "https://app.phoenix.arize.com/v1/traces"
        : undefined);

    registerOTel({
      serviceName: "medmate",
      ...(exporterEndpoint
        ? {
            traceExporter: (() => {
              const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
              return new OTLPTraceExporter({
                url: exporterEndpoint,
                headers: {
                  ...(process.env.PHOENIX_API_KEY
                    ? { "x-api-key": process.env.PHOENIX_API_KEY }
                    : {}),
                },
              });
            })(),
          }
        : {}),
    });
  }
}
