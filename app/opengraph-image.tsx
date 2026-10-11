import { ImageResponse } from "next/og";

export const alt = "InsafDost AI, a research aid for Pakistani law";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#09090b",
          color: "#f4f4f5",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 600,
            color: "#fafafa",
          }}
        >
          InsafDost AI
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Pakistani case law research with AI
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 34,
              color: "#a1a1aa",
            }}
          >
            Not legal advice. Verify every citation.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
