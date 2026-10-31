'use client';

import React from 'react';

/**
 * 1. Hoạt họa Cuộc gọi AI Voice (Voice-to-Voice & Zero-shot TTS)
 * Minh họa nhân vật AI Sales Agent (đeo tai nghe) trò chuyện trực tiếp với Khách hàng B2B
 * qua luồng sóng âm SVG chuyển động mượt mà (Sine-wave morphing).
 */
export function VoiceConversationIllustration({
  isPlaying = false,
  speakerName = 'Bảo (Voice Clone)',
  customerName = 'Khách hàng B2B',
  className = '',
}: {
  isPlaying?: boolean;
  speakerName?: string;
  customerName?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 680 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="voiceWaveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="voiceWaveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="agentAvatarBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="customerAvatarBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Subtle ambient background rings */}
        <circle cx="125" cy="150" r="72" stroke="#6366f1" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="555" cy="150" r="72" stroke="#06b6d4" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Animated Continuous Sine Waves between Customer & AI Agent */}
        <g opacity={isPlaying ? 1 : 0.75}>
          <path
            d="M 185 150 Q 245 95, 305 150 T 425 150 T 495 150"
            stroke="url(#voiceWaveGrad1)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          >
            <animate
              attributeName="d"
              dur={isPlaying ? '1.1s' : '2.8s'}
              repeatCount="indefinite"
              values="
                M 185 150 Q 245 90, 305 150 T 425 150 T 495 150;
                M 185 150 Q 245 210, 305 150 T 425 150 T 495 150;
                M 185 150 Q 245 90, 305 150 T 425 150 T 495 150
              "
            />
          </path>

          <path
            d="M 185 150 Q 245 195, 305 150 T 425 150 T 495 150"
            stroke="url(#voiceWaveGrad2)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          >
            <animate
              attributeName="d"
              dur={isPlaying ? '1.4s' : '3.4s'}
              repeatCount="indefinite"
              values="
                M 185 150 Q 245 200, 305 150 T 425 150 T 495 150;
                M 185 150 Q 245 100, 305 150 T 425 150 T 495 150;
                M 185 150 Q 245 200, 305 150 T 425 150 T 495 150
              "
            />
          </path>

          {/* Traveling Acoustic Voice Packets */}
          <circle r="5" fill="#a855f7">
            <animateMotion
              dur={isPlaying ? '1.5s' : '2.6s'}
              repeatCount="indefinite"
              path="M 185 150 Q 260 115, 340 150 T 495 150"
            />
          </circle>
          <circle r="4" fill="#06b6d4">
            <animateMotion
              dur={isPlaying ? '1.8s' : '3.1s'}
              repeatCount="indefinite"
              path="M 495 150 Q 420 185, 340 150 T 185 150"
            />
          </circle>
        </g>

        {/* Center Acoustic Equalizer Pill */}
        <g transform="translate(290, 122)">
          <rect width="100" height="56" rx="28" fill="#0f172a" stroke="#6366f1" strokeOpacity="0.4" strokeWidth="1.5" />
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
            const x = 22 + idx * 9;
            const durs = ['0.7s', '1.1s', '0.6s', '0.9s', '1.2s', '0.8s', '1.0s'];
            return (
              <rect
                key={idx}
                x={x}
                y="18"
                width="4"
                height="20"
                rx="2"
                fill={idx % 2 === 0 ? '#818cf8' : '#22d3ee'}
              >
                <animate
                  attributeName="height"
                  values={isPlaying ? '8;32;12;28;8' : '6;18;8;14;6'}
                  dur={durs[idx]}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="y"
                  values={isPlaying ? '24;12;22;14;24' : '25;19;24;21;25'}
                  dur={durs[idx]}
                  repeatCount="indefinite"
                />
              </rect>
            );
          })}
        </g>

        {/* LEFT CHARACTER: AI Voice Agent (Headset & Friendly Face) */}
        <g className="animate-float">
          {/* Glowing Halo when speaking */}
          <circle cx="125" cy="150" r="56" fill="#6366f1" fillOpacity="0.14">
            <animate attributeName="r" values="52;62;52" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="125" cy="150" r="46" fill="url(#agentAvatarBg)" />

          {/* Illustrated Character Head & Shoulders */}
          <path d="M 97 190 C 97 172, 153 172, 153 190" fill="#e0e7ff" />
          <circle cx="125" cy="142" r="20" fill="#fde68a" />
          {/* Stylish Hair */}
          <path d="M 105 138 C 105 120, 145 120, 145 138 C 142 128, 112 128, 105 138 Z" fill="#1e1b4b" />
          {/* Friendly Eyes & Smile */}
          <circle cx="118" cy="142" r="2.2" fill="#1e1b4b" />
          <circle cx="132" cy="142" r="2.2" fill="#1e1b4b" />
          <path d="M 119 150 Q 125 155, 131 150" stroke="#1e1b4b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* Pro AI Headset & Boom Mic */}
          <path d="M 103 142 A 22 22 0 0 1 147 142" stroke="#38bdf8" strokeWidth="3.5" fill="none" />
          <rect x="99" y="136" width="7" height="14" rx="3.5" fill="#0284c7" />
          <rect x="144" y="136" width="7" height="14" rx="3.5" fill="#0284c7" />
          <path d="M 103 148 Q 108 158, 120 156" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="121" cy="156" r="2.5" fill="#22d3ee" />

          {/* Floating Speech Bubble Above AI Agent */}
          <g className="animate-spring-pop" transform="translate(48, 36)">
            <rect width="165" height="38" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <path d="M 72 38 L 78 46 L 86 38 Z" fill="#ffffff" />
            <circle cx="20" cy="19" r="5" fill="#10b981" />
            <text x="32" y="16" fill="#0f172a" fontSize="10" fontWeight="800" fontFamily="sans-serif">
              {speakerName}
            </text>
            <text x="32" y="28" fill="#6366f1" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
              &ldquo;Dạ gói CRM giảm 10% ạ!&rdquo;
            </text>
          </g>
        </g>

        {/* RIGHT CHARACTER: B2B Customer */}
        <g className="animate-float-delayed">
          <circle cx="555" cy="150" r="56" fill="#06b6d4" fillOpacity="0.12">
            <animate attributeName="r" values="54;60;54" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="555" cy="150" r="46" fill="url(#customerAvatarBg)" />

          {/* Customer Head & Suit */}
          <path d="M 527 190 C 527 172, 583 172, 583 190" fill="#cffafe" />
          <circle cx="555" cy="142" r="20" fill="#fed7aa" />
          {/* Hair & Glasses */}
          <path d="M 535 136 C 536 118, 574 118, 575 136 C 566 126, 544 126, 535 136 Z" fill="#334155" />
          <rect x="543" y="138" width="9" height="6" rx="2" stroke="#0f172a" strokeWidth="1.6" fill="none" />
          <rect x="558" y="138" width="9" height="6" rx="2" stroke="#0f172a" strokeWidth="1.6" fill="none" />
          <line x1="552" y1="141" x2="558" y2="141" stroke="#0f172a" strokeWidth="1.6" />
          <path d="M 550 151 Q 555 155, 560 151" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Floating Speech Bubble Above Customer */}
          <g className="animate-spring-pop" transform="translate(458, 36)">
            <rect width="174" height="38" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <path d="M 92 38 L 98 46 L 106 38 Z" fill="#ffffff" />
            <circle cx="20" cy="19" r="5" fill="#06b6d4" />
            <text x="32" y="16" fill="#0f172a" fontSize="10" fontWeight="800" fontFamily="sans-serif">
              {customerName}
            </text>
            <text x="32" y="28" fill="#0891b2" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
              &ldquo;Báo giá giúp chị gói 50 user&rdquo;
            </text>
          </g>
        </g>

        {/* Bottom Status Pills */}
        <g transform="translate(80, 226)">
          <rect width="110" height="26" rx="13" fill="#1e1b4b" stroke="#4f46e5" strokeOpacity="0.5" />
          <circle cx="16" cy="13" r="4" fill="#34d399" />
          <text x="26" y="16.5" fill="#e0e7ff" fontSize="10" fontWeight="700" fontFamily="monospace">
            24kHz Neural
          </text>
        </g>

        <g transform="translate(275, 226)">
          <rect width="130" height="26" rx="13" fill="#0f172a" stroke="#38bdf8" strokeOpacity="0.4" />
          <text x="65" y="16.5" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700" fontFamily="monospace">
            ⚡ Độ trễ ~680ms
          </text>
        </g>

        <g transform="translate(490, 226)">
          <rect width="115" height="26" rx="13" fill="#083344" stroke="#06b6d4" strokeOpacity="0.5" />
          <circle cx="16" cy="13" r="4" fill="#22d3ee" />
          <text x="26" y="16.5" fill="#cffafe" fontSize="10" fontWeight="700" fontFamily="monospace">
            Intent: 96%
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * 2. Hoạt họa Nhạc Trưởng Điều Phối Đa Tác Tử (Multi-Agent Orchestrator Canvas)
 * Minh họa luồng suy luận ReAct từ Nhạc trưởng (LLM Core) phân phối tác vụ tới 3 Sub-Agents
 * với đường cong Bezier và xung năng lượng di chuyển mượt mà.
 */
export function MultiAgentOrchestratorIllustration({
  activeStep = 0,
  className = '',
}: {
  activeStep?: number;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 680 270"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="beamCyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="beamPurple" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="beamAmber" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Bezier Connector Curves from Orchestrator (x=155, y=135) to 3 Sub-Agents (x=470) */}
        <path
          id="agentCurveTop"
          d="M 215 120 C 310 120, 340 52, 445 52"
          stroke="url(#beamCyan)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className="animate-dash-stream"
        />
        <path
          id="agentCurveMid"
          d="M 215 135 C 310 135, 340 135, 445 135"
          stroke="url(#beamPurple)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className="animate-dash-stream"
        />
        <path
          id="agentCurveBot"
          d="M 215 150 C 310 150, 340 218, 445 218"
          stroke="url(#beamAmber)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className="animate-dash-stream"
        />

        {/* Animated Data Packets traveling along the Bezier paths */}
        <circle r="5" fill="#22d3ee">
          <animateMotion dur="2.1s" repeatCount="indefinite">
            <mpath href="#agentCurveTop" />
          </animateMotion>
        </circle>
        <circle r="5" fill="#c084fc">
          <animateMotion dur="1.8s" repeatCount="indefinite">
            <mpath href="#agentCurveMid" />
          </animateMotion>
        </circle>
        <circle r="5" fill="#fbbf24">
          <animateMotion dur="2.4s" repeatCount="indefinite">
            <mpath href="#agentCurveBot" />
          </animateMotion>
        </circle>

        {/* Left Hub: Nhạc Trưởng AI (Orchestrator Node) */}
        <g className="animate-float" transform="translate(35, 72)">
          <rect
            width="180"
            height="126"
            rx="24"
            fill="#1e1b4b"
            stroke="#818cf8"
            strokeWidth="2"
          />
          <circle cx="46" cy="48" r="24" fill="#4f46e5" />
          {/* Illustrated Brain/Conductor Icon */}
          <path
            d="M 38 48 C 38 40, 54 40, 54 48 C 54 56, 38 56, 38 48 Z"
            stroke="#e0e7ff"
            strokeWidth="2.2"
            fill="none"
          />
          <circle cx="46" cy="48" r="4" fill="#38bdf8" />
          <text x="80" y="42" fill="#a5b4fc" fontSize="9.5" fontWeight="800" fontFamily="monospace">
            ORCHESTRATOR
          </text>
          <text x="80" y="58" fill="#ffffff" fontSize="13" fontWeight="800" fontFamily="sans-serif">
            Nhạc Trưởng
          </text>
          <rect x="20" y="84" width="140" height="24" rx="12" fill="#312e81" />
          <circle cx="34" cy="96" r="4" fill="#34d399" />
          <text x="45" y="100" fill="#e0e7ff" fontSize="10" fontWeight="700" fontFamily="monospace">
            ReAct Tool Router
          </text>
        </g>

        {/* Right Sub-Agent 1: CRM Lead Scoring */}
        <g transform="translate(445, 20)">
          <rect
            width="205"
            height="64"
            rx="18"
            fill="#0f172a"
            stroke={activeStep === 0 ? '#22d3ee' : '#334155'}
            strokeWidth="2"
          />
          <rect x="14" y="14" width="36" height="36" rx="12" fill="#083344" />
          <path d="M 24 38 L 24 28 M 32 38 L 32 22 M 40 38 L 40 30" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
          <text x="60" y="28" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">
            CRM Lead Scoring
          </text>
          <text x="60" y="45" fill="#38bdf8" fontSize="10" fontWeight="600" fontFamily="monospace">
            Điểm B2B: 92/100 (VIP)
          </text>
        </g>

        {/* Right Sub-Agent 2: Hybrid RAG Retriever */}
        <g transform="translate(445, 103)">
          <rect
            width="205"
            height="64"
            rx="18"
            fill="#0f172a"
            stroke={activeStep === 1 ? '#c084fc' : '#334155'}
            strokeWidth="2"
          />
          <rect x="14" y="14" width="36" height="36" rx="12" fill="#3b0764" />
          <circle cx="30" cy="30" r="7" stroke="#c084fc" strokeWidth="2.2" fill="none" />
          <line x1="35" y1="35" x2="41" y2="41" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" />
          <text x="60" y="28" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">
            Hybrid RAG Agent
          </text>
          <text x="60" y="45" fill="#c084fc" fontSize="10" fontWeight="600" fontFamily="monospace">
            pgvector Cosine: 0.984
          </text>
        </g>

        {/* Right Sub-Agent 3: Quote & HITL Approval */}
        <g transform="translate(445, 186)">
          <rect
            width="205"
            height="64"
            rx="18"
            fill="#0f172a"
            stroke={activeStep === 2 ? '#fbbf24' : '#334155'}
            strokeWidth="2"
          />
          <rect x="14" y="14" width="36" height="36" rx="12" fill="#451a03" />
          <path d="M 32 20 L 42 25 V 33 C 42 39, 32 43, 32 43 C 32 43, 22 39, 22 33 V 25 L 32 20 Z" stroke="#fbbf24" strokeWidth="2" fill="none" />
          <text x="60" y="28" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">
            HITL Approval Gate
          </text>
          <text x="60" y="45" fill="#fbbf24" fontSize="10" fontWeight="600" fontFamily="monospace">
            Cần duyệt CK 18% (&gt;10%)
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * 3. Hoạt họa Quét Tài Liệu & Không Gian Vector (Hybrid RAG & pgvector)
 * Minh họa tài liệu PDF chính sách giá được tia laser quét qua và biến thành các điểm
 * tọa độ Vector Embeddings 1536 chiều trong không gian hình học.
 */
export function RagVectorSearchIllustration({
  topicLabel = 'Chính sách chiết khấu Enterprise',
  similarity = '98.4%',
  className = '',
}: {
  topicLabel?: string;
  similarity?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 680 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Left: Animated Policy Document with Laser Scanner Bar */}
        <g transform="translate(45, 32)">
          <rect width="150" height="190" rx="18" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Document Header */}
          <rect x="20" y="22" width="65" height="10" rx="5" fill="#38bdf8" />
          <rect x="20" y="42" width="110" height="7" rx="3.5" fill="#64748b" />
          <rect x="20" y="56" width="95" height="7" rx="3.5" fill="#64748b" />
          {/* Highlighted Extracted Chunk */}
          <rect x="16" y="76" width="118" height="44" rx="10" fill="#06b6d4" fillOpacity="0.18" stroke="#22d3ee" strokeWidth="1.5" />
          <rect x="24" y="86" width="88" height="7" rx="3.5" fill="#cffafe" />
          <rect x="24" y="100" width="70" height="7" rx="3.5" fill="#67e8f9" />
          {/* Remaining Lines */}
          <rect x="20" y="134" width="105" height="7" rx="3.5" fill="#475569" />
          <rect x="20" y="148" width="80" height="7" rx="3.5" fill="#475569" />
          <rect x="20" y="164" width="60" height="14" rx="7" fill="#0f172a" />
          <text x="50" y="174" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
            PDF • KB
          </text>

          {/* Animated Laser Scan Beam */}
          <g className="animate-scan-vertical">
            <line x1="8" y1="35" x2="142" y2="35" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
            <rect x="8" y="35" width="134" height="18" fill="#22d3ee" fillOpacity="0.15" />
          </g>
        </g>

        {/* Center: Embedding Transformation Stream */}
        <path
          id="ragEmbedStream"
          d="M 205 130 C 265 100, 315 160, 380 130"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeDasharray="5 5"
          className="animate-dash-stream"
        />
        <circle r="5" fill="#38bdf8">
          <animateMotion dur="1.6s" repeatCount="indefinite">
            <mpath href="#ragEmbedStream" />
          </animateMotion>
        </circle>

        <g transform="translate(238, 108)">
          <rect width="112" height="42" rx="12" fill="#0f172a" stroke="#06b6d4" strokeOpacity="0.5" />
          <text x="56" y="18" textAnchor="middle" fill="#67e8f9" fontSize="9" fontWeight="700" fontFamily="monospace">
            EMBEDDING 1536D
          </text>
          <text x="56" y="32" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontWeight="700" fontFamily="monospace">
            [0.82, -0.14, ...]
          </text>
        </g>

        {/* Right: Isometric Vector Cube & Cosine Cluster */}
        <g transform="translate(395, 25)" className="animate-float">
          <rect width="245" height="205" rx="24" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          {/* Isometric Hexagon / Cube Wireframe */}
          <polygon
            points="122,28 192,66 192,142 122,180 52,142 52,66"
            stroke="#38bdf8"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            fill="#083344"
            fillOpacity="0.3"
          />
          <line x1="122" y1="28" x2="122" y2="104" stroke="#38bdf8" strokeOpacity="0.25" strokeDasharray="3 3" />
          <line x1="122" y1="104" x2="192" y2="142" stroke="#38bdf8" strokeOpacity="0.25" strokeDasharray="3 3" />
          <line x1="122" y1="104" x2="52" y2="142" stroke="#38bdf8" strokeOpacity="0.25" strokeDasharray="3 3" />

          {/* Vector Nodes & Nearest-Neighbor Connections */}
          <line x1="122" y1="96" x2="156" y2="76" stroke="#10b981" strokeWidth="2" />
          <line x1="122" y1="96" x2="88" y2="82" stroke="#22d3ee" strokeWidth="1.5" />
          <line x1="122" y1="96" x2="144" y2="128" stroke="#22d3ee" strokeWidth="1.5" />

          <circle cx="88" cy="82" r="5" fill="#38bdf8" />
          <circle cx="144" cy="128" r="5" fill="#818cf8" />
          <circle cx="156" cy="76" r="6" fill="#34d399" />

          {/* Active Query Target Vector */}
          <circle cx="122" cy="96" r="14" fill="#10b981" fillOpacity="0.25">
            <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="122" cy="96" r="7" fill="#10b981" />

          {/* Top Similarity Badge */}
          <rect x="24" y="158" width="196" height="30" rx="10" fill="#064e3b" stroke="#10b981" strokeOpacity="0.6" />
          <text x="122" y="177" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="800" fontFamily="monospace">
            ✓ Match {similarity} • {topicLabel.slice(0, 18)}
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * 4. Hoạt họa Hạ tầng Docker & Cloud Microservices (Isometric Vector Stack)
 */
export function CloudStackIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 680 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Connecting Data Streams between Containers */}
        <path
          id="infraPath1"
          d="M 165 120 L 275 120"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className="animate-dash-stream"
        />
        <path
          id="infraPath2"
          d="M 405 120 L 515 120"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className="animate-dash-stream"
        />

        <circle r="4.5" fill="#22d3ee">
          <animateMotion dur="1.4s" repeatCount="indefinite">
            <mpath href="#infraPath1" />
          </animateMotion>
        </circle>
        <circle r="4.5" fill="#a855f7">
          <animateMotion dur="1.4s" repeatCount="indefinite">
            <mpath href="#infraPath2" />
          </animateMotion>
        </circle>

        {/* Node 1: Next.js Web + Nginx SSL */}
        <g transform="translate(35, 58)" className="animate-float">
          <rect width="145" height="124" rx="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="34" cy="36" r="16" fill="#0284c7" fillOpacity="0.25" />
          <path d="M 27 36 L 32 41 L 42 31" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="58" y="34" fill="#38bdf8" fontSize="9.5" fontWeight="800" fontFamily="monospace">
            HTTPS :443
          </text>
          <text x="58" y="48" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">
            Next.js Web
          </text>
          <rect x="18" y="76" width="109" height="28" rx="10" fill="#1e293b" />
          <text x="72" y="94" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" fontFamily="monospace">
            UI Workspace
          </text>
        </g>

        {/* Node 2: NestJS API Gateway + VieNeu-TTS + n8n */}
        <g transform="translate(260, 44)" className="animate-float-delayed">
          <rect width="160" height="152" rx="22" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
          <circle cx="80" cy="42" r="20" fill="#4f46e5" />
          <path d="M 72 42 L 78 48 L 90 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="80" y="78" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800" fontFamily="sans-serif">
            NestJS + n8n Core
          </text>
          <text x="80" y="95" textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="600" fontFamily="monospace">
            JWT HttpOnly • RBAC
          </text>
          <rect x="20" y="110" width="120" height="26" rx="10" fill="#312e81" />
          <text x="80" y="127" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700" fontFamily="monospace">
            ● VieNeu-TTS :8008
          </text>
        </g>

        {/* Node 3: PostgreSQL 17 + pgvector */}
        <g transform="translate(500, 58)" className="animate-float">
          <rect width="145" height="124" rx="20" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          {/* Database Cylinder Icon */}
          <ellipse cx="40" cy="32" rx="14" ry="6" stroke="#34d399" strokeWidth="2" fill="none" />
          <path d="M 26 32 V 46 C 26 50, 54 50, 54 46 V 32" stroke="#34d399" strokeWidth="2" fill="none" />
          <text x="64" y="34" fill="#34d399" fontSize="9.5" fontWeight="800" fontFamily="monospace">
            PGVECTOR
          </text>
          <text x="64" y="48" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">
            Postgres 17
          </text>
          <rect x="18" y="76" width="109" height="28" rx="10" fill="#064e3b" />
          <text x="72" y="94" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="700" fontFamily="monospace">
            Vector + CRM DB
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * 5. Hoạt họa Tác tử Tự chủ ReAct (Autonomous Agentic ReAct Cycle)
 * Trực quan hóa chu trình Suy luận (Thought) -> Hành động (Action) -> Quan sát (Observation) -> Phản hồi
 */
export function AutonomousAgentReActIllustration({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 680 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="reactLoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient background grid lines */}
        <line x1="60" y1="115" x2="620" y2="115" stroke="#10b981" strokeOpacity="0.15" strokeDasharray="6 6" />

        {/* ReAct Cyclical Arrows */}
        {/* Forward Stream: Input -> Brain -> Tools */}
        <path
          id="reactStreamForward"
          d="M 170 115 C 230 115, 250 85, 310 85 S 390 85, 450 115"
          stroke="url(#reactLoopGrad)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          className="animate-dash-stream"
        />
        {/* Return Stream: Observation Loop back */}
        <path
          id="reactStreamReturn"
          d="M 450 135 C 390 165, 350 165, 310 165 S 230 165, 170 135"
          stroke="#10b981"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Animated Packets */}
        <circle r="4" fill="#34d399">
          <animateMotion dur="2.4s" repeatCount="indefinite">
            <mpath href="#reactStreamForward" />
          </animateMotion>
        </circle>
        <circle r="3.5" fill="#38bdf8">
          <animateMotion dur="2.8s" repeatCount="indefinite">
            <mpath href="#reactStreamReturn" />
          </animateMotion>
        </circle>

        {/* Node 1: User Request / Business Goal (x=50, y=55) */}
        <g transform="translate(40, 55)">
          <rect width="130" height="120" rx="18" fill="#022c22" stroke="#059669" strokeWidth="2" />
          <circle cx="65" cy="38" r="18" fill="#047857" />
          <text x="65" y="44" textAnchor="middle" fill="#ffffff" fontSize="16">
            🎯
          </text>
          <text x="65" y="76" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="800" fontFamily="monospace">
            B2B SALES GOAL
          </text>
          <text x="65" y="94" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">
            Mục Tiêu Bán Hàng
          </text>
          <text x="65" y="110" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="600" fontFamily="monospace">
            Unstructured Task
          </text>
        </g>

        {/* Node 2: Agentic Brain - ReAct Reasoning Core (x=275, y=40) */}
        <g transform="translate(255, 40)">
          <rect
            width="170"
            height="150"
            rx="24"
            fill="#064e3b"
            stroke="#10b981"
            strokeWidth="2.5"
            filter="url(#emeraldGlow)"
            className="animate-pulse-slow"
          />
          <circle cx="85" cy="44" r="22" fill="#047857" />
          <text x="85" y="51" textAnchor="middle" fill="#ffffff" fontSize="20">
            🧠
          </text>
          <text x="85" y="84" textAnchor="middle" fill="#a7f3d0" fontSize="10.5" fontWeight="800" fontFamily="monospace">
            AGENTIC BRAIN (ReAct)
          </text>
          <text x="85" y="103" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
            Gemini 3.5 Flash Lite
          </text>
          <rect x="20" y="118" width="130" height="24" rx="8" fill="#022c22" />
          <text x="85" y="134" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="700" fontFamily="monospace">
            Thought ➔ Tool Action
          </text>
        </g>

        {/* Node 3: External Tools & APIs (x=495, y=55) */}
        <g transform="translate(490, 55)">
          <rect width="150" height="120" rx="18" fill="#022c22" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="75" cy="38" r="18" fill="#0891b2" />
          <text x="75" y="44" textAnchor="middle" fill="#ffffff" fontSize="16">
            🛠️
          </text>
          <text x="75" y="76" textAnchor="middle" fill="#67e8f9" fontSize="10" fontWeight="800" fontFamily="monospace">
            DYNAMIC TOOLS
          </text>
          <text x="75" y="94" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">
            ROI • CRM • Copywriter
          </text>
          <text x="75" y="110" textAnchor="middle" fill="#22d3ee" fontSize="9" fontWeight="600" fontFamily="monospace">
            Observation Feedback
          </text>
        </g>
      </svg>
    </div>
  );
}

