import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5B6EF5 0%, #818CF8 100%)",
            opacity: 0.25,
            filter: "blur(10px)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 110,
                borderRadius: 23,
                background: "#5B6EF5",
                transform: "rotate(28deg)",
              }}
            />
            <div
              style={{
                width: 46,
                height: 110,
                borderRadius: 23,
                background: "#5B6EF5",
                transform: "rotate(28deg)",
                marginLeft: -20,
              }}
            />
          </div>
          <span style={{ fontSize: 90, fontWeight: 800, color: "#0A0A0A" }}>Mentra.AI</span>
        </div>

        <p
          style={{
            marginTop: 28,
            fontSize: 32,
            color: "#6B7280",
            maxWidth: 820,
            textAlign: "center",
          }}
        >
          Платформа для сообществ и онлайн-школ в Центральной Азии
        </p>
      </div>
    ),
    { ...size }
  );
}
