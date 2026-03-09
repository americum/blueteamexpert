import { useState, useEffect } from "react";

const MODELS = [
  {
    id: "secbert",
    name: "SecBERT / CyBERT",
    params: "0.11B",
    role: "Ingestion & Tokenization",
    layer: "ingestion",
    color: "#00FFB2",
    desc: "Specialized BERT variants pre-trained on cybersecurity corpora. Handles raw log ingestion, entity extraction (IPs, hashes, CVEs, domains), semantic tagging, and rapid triage classification before routing to deeper experts.",
    inputs: ["Raw logs", "SIEM events", "NetFlow", "Syslog", "Alert streams"],
    outputs: ["Typed entities", "Severity triage", "Routing tokens"],
    quant: "FP16 (tiny — always resident in memory)",
    vram: "~0.5 GB",
  },
  {
    id: "mistral",
    name: "Mistral 8×7B",
    params: "56B total / ~13B active",
    role: "Real-Time Detection Engine",
    layer: "detection",
    color: "#FF6B35",
    desc: "Sparse MoE by design — routes each token through 2 of 8 experts. Perfect for high-throughput anomaly detection, pattern matching, alert correlation, and real-time threat scoring with low latency.",
    inputs: ["Triaged alerts", "Entity graph", "Behavioral baselines"],
    outputs: ["Threat score", "MITRE TTP tags", "Priority queue"],
    quant: "4-bit GPTQ",
    vram: "~28 GB",
  },
  {
    id: "falcon",
    name: "Falcon 180B",
    params: "180B",
    role: "Deep Threat Analysis & Forensic Expert",
    layer: "analysis",
    color: "#FF2D55",
    desc: "The system's most powerful reasoner. Invoked only for high-priority escalations. Performs deep kill-chain reconstruction, multi-stage APT attribution, sophisticated forensic timeline analysis, and full attack narrative generation. Fed the ENTIRE protected system architecture at context start.",
    inputs: ["Full system architecture", "Escalated alerts", "Forensic artifacts", "Memory dumps"],
    outputs: ["Full forensic report", "Attribution hypothesis", "Kill-chain map", "Remediation playbook"],
    quant: "4-bit GPTQ + paged attention",
    vram: "~90 GB (2× A100 80GB or equivalent)",
  },
  {
    id: "phi3",
    name: "Phi-3 Medium",
    params: "14B",
    role: "Endpoint Security Expert",
    layer: "detection",
    color: "#7B61FF",
    desc: "Microsoft's highly capable small model, fine-tuned for endpoint telemetry. Analyzes EDR data, process trees, registry changes, file system events, and memory anomalies. Loaded with complete host inventory and baseline profiles.",
    inputs: ["EDR telemetry", "Process trees", "Registry diffs", "Host inventory"],
    outputs: ["Endpoint risk score", "Lateral movement indicators", "Process anomaly flags"],
    quant: "4-bit AWQ",
    vram: "~8 GB",
  },
  {
    id: "qwen",
    name: "Qwen 2.5",
    params: "72B",
    role: "Multilingual Threat Intel Expert",
    layer: "intel",
    color: "#FFD60A",
    desc: "World-class multilingual capabilities across 30+ languages. Ingests threat intel from non-English darkweb forums, Russian/Chinese/Arabic hacker communities, regional CERT advisories, and OSINT sources. Translates, contextualizes, and correlates global threat landscape.",
    inputs: ["Dark web feeds (Tor)", "Foreign language forums", "Regional CERTs", "OSINT"],
    outputs: ["Normalized TI reports", "Translated IOCs", "Actor profiles"],
    quant: "4-bit GPTQ",
    vram: "~36 GB",
  },
  {
    id: "deepseek",
    name: "DeepSeek Coder V2 Lite",
    params: "16B",
    role: "YARA / Sigma / Malware Analysis Expert",
    layer: "analysis",
    color: "#0AC4FF",
    desc: "Specialized in code-level analysis. Generates YARA rules from malware samples, writes Sigma detection rules, performs static malware analysis, decompiles shellcode, and automates IOC extraction from binary artifacts.",
    inputs: ["Malware samples", "Shellcode", "Suspicious scripts", "Binary blobs"],
    outputs: ["YARA rules", "Sigma rules", "IOC lists", "Decompiled pseudocode"],
    quant: "4-bit AWQ",
    vram: "~10 GB",
  },
  {
    id: "codellama",
    name: "CodeLlama 34B",
    params: "34B",
    role: "Detection Engineering & Automation",
    layer: "engineering",
    color: "#FF9500",
    desc: "Builds and maintains detection infrastructure. Writes KQL queries for Sentinel, SPL for Splunk, detection-as-code pipelines, automates playbook creation, integrates with SOAR platforms, and maintains the detection rule lifecycle.",
    inputs: ["Detection requirements", "Threat models", "SIEM schema"],
    outputs: ["KQL/SPL/EQL queries", "SOAR playbooks", "Detection-as-code", "CI/CD configs"],
    quant: "4-bit GPTQ",
    vram: "~17 GB",
  },
  {
    id: "vigil",
    name: "VigilLLM / Llama Guard 2",
    params: "7B",
    role: "Guardrails & AI Security Expert",
    layer: "safety",
    color: "#FF3B30",
    desc: "Constitutional safety layer. Prevents misuse of the platform — blocks attackers from weaponizing the system for offensive operations. Classifies every prompt/response pair for policy compliance, detects prompt injection attacks, and enforces the system's defensive-only mission. Wraps ALL other models.",
    inputs: ["All prompts", "All LLM outputs", "User sessions"],
    outputs: ["Allow/Block decision", "Policy violation flags", "Audit logs"],
    quant: "FP16 (always-on, latency-critical)",
    vram: "~14 GB",
  },
  {
    id: "orca",
    name: "Orca 2",
    params: "13B",
    role: "Incident Response Reasoning Expert",
    layer: "response",
    color: "#30D158",
    desc: "Trained on chain-of-thought and 'System 2' deliberate reasoning. Orchestrates incident response workflows, decides containment strategies, prioritizes remediation steps, coordinates cross-team actions, and generates post-incident reports with root cause analysis.",
    inputs: ["Incident timeline", "Affected assets", "Available controls"],
    outputs: ["IR playbook steps", "Containment actions", "Root cause analysis", "Lessons learned"],
    quant: "4-bit AWQ",
    vram: "~7 GB",
  },
  {
    id: "openchat",
    name: "OpenChat 3.5",
    params: "7B",
    role: "SOC Analyst Interface",
    layer: "interface",
    color: "#5AC8FA",
    desc: "The human-facing conversational layer. SOC analysts interact via natural language questions. Translates technical findings into human-readable briefings, answers analyst questions, explains detections in plain language, and provides tiered summaries (executive → technical).",
    inputs: ["Analyst queries", "Technical findings", "Incident data"],
    outputs: ["Natural language briefings", "Q&A responses", "Executive summaries", "Tiered reports"],
    quant: "4-bit GPTQ",
    vram: "~5 GB",
  },
  {
    id: "wizardcoder",
    name: "WizardCoder 34B",
    params: "34B",
    role: "Threat Hunter & Query Generator",
    layer: "hunting",
    color: "#BF5AF2",
    desc: "Proactive threat hunting engine. Generates hypothesis-driven hunt queries, develops hunting playbooks based on latest threat intel, synthesizes hunt findings, and continuously searches for signs of dwell time and living-off-the-land techniques across the entire estate.",
    inputs: ["Threat intel", "System telemetry", "Hunt hypotheses", "MITRE TTPs"],
    outputs: ["Hunt queries", "Hunt reports", "Dwell time estimates", "LotL detections"],
    quant: "4-bit GPTQ",
    vram: "~17 GB",
  },
  {
    id: "zephyr",
    name: "Zephyr 7B",
    params: "7B",
    role: "Compliance & Policy Enforcement",
    layer: "compliance",
    color: "#A2845E",
    desc: "Ensures all actions and recommendations comply with ISO 27001, NIST CSF, GDPR, local regulatory frameworks, and organizational policy. Reviews incident reports for regulatory disclosure requirements, tracks compliance posture, and generates audit-ready documentation.",
    inputs: ["Incident reports", "Actions taken", "Policy database", "Regulatory frameworks"],
    outputs: ["Compliance assessments", "Disclosure requirements", "Audit trails", "Policy gap analysis"],
    quant: "4-bit AWQ",
    vram: "~5 GB",
  },
];

const THREAT_INTEL_SOURCES = [
  { name: "MITRE ATT&CK", type: "clearnet", category: "Framework", update: "Quarterly + live PRs" },
  { name: "CVE / NVD Feed", type: "clearnet", category: "Vulnerabilities", update: "Real-time" },
  { name: "Abuse.ch (MalwareBazaar, URLhaus, ThreatFox)", type: "clearnet", category: "Malware IOCs", update: "Hourly" },
  { name: "AlienVault OTX", type: "clearnet", category: "Threat Intel", update: "Continuous" },
  { name: "CISA Advisories & KEV", type: "clearnet", category: "Gov Intel", update: "Real-time" },
  { name: "OpenCTI Platform", type: "clearnet", category: "STIX/TAXII", update: "Continuous" },
  { name: "Ransomware Tracker (ransomware.live)", type: "clearnet", category: "Ransomware", update: "Daily" },
  { name: "PhishTank / OpenPhish", type: "clearnet", category: "Phishing", update: "Hourly" },
  { name: "Shodan Monitor (free tier)", type: "clearnet", category: "Exposure", update: "Daily" },
  { name: "Tor Darkweb Forums (monitored)", type: "darkweb", category: "Threat Actor Intel", update: "Continuous (Tor crawler)" },
  { name: "RansomHub / LockBit Leak Sites", type: "darkweb", category: "Ransomware Groups", update: "Daily (Tor)" },
  { name: "Exploit Markets (monitored, read-only)", type: "darkweb", category: "0-day Intel", update: "Continuous" },
  { name: "Paste Sites (Pastebin, Ghostbin)", type: "clearnet", category: "Data Leaks", update: "Continuous" },
  { name: "GitHub Security Advisories", type: "clearnet", category: "OSS Vulns", update: "Real-time webhook" },
];

const CAI_PRINCIPLES = [
  { title: "Defensive-Only Mandate", desc: "The system's constitutional prime directive: ALL capabilities exist solely to detect, contain, analyze, and remediate threats — never to generate offensive payloads, exploit code, or attack capabilities." },
  { title: "Harm Avoidance Self-Critique", desc: "Every model output passes through a CAI critique loop: 'Could this output be used to harm systems or people?' If yes, the response is revised or blocked by VigilLLM." },
  { title: "Adversarial Input Resistance", desc: "VigilLLM scans all inputs for prompt injection, jailbreak attempts, and adversarial queries designed to weaponize the system." },
  { title: "Tiered Access Control", desc: "Constitutional enforcement of access tiers: Analyst (query/report), Engineer (rule creation), Admin (model config), each with scoped capabilities." },
  { title: "Transparency & Explainability", desc: "Every automated decision includes a reasoning chain. No black-box actions — SOC analysts always understand WHY the system took an action." },
  { title: "Self-Improvement Audit", desc: "All fine-tuning data is reviewed for poisoning attacks before training. New examples that contradict defensive principles are rejected by the CAI filter." },
  { title: "Data Minimization", desc: "PII and sensitive organizational data used for analysis is not retained in model weights. Ephemeral analysis only — constitutional privacy principle." },
  { title: "Continuous Red-Teaming", desc: "Internal adversarial loop: a red-team agent (sandboxed Mistral instance) attempts to misuse the system weekly. Findings harden VigilLLM's policies." },
];

const SELF_IMPROVEMENT = [
  { phase: "01", title: "Continuous Threat Intel Ingestion", desc: "Automated scrapers ingest clearnet and darkweb feeds every 15-60 minutes. New IOCs, TTPs, and threat actor behaviors are normalized into STIX 2.1 format and stored in the knowledge graph." },
  { phase: "02", title: "Delta Detection", desc: "New threat data is diffed against existing model knowledge using embedding similarity. If new patterns are sufficiently novel (cosine distance > threshold), they're queued for fine-tuning." },
  { phase: "03", title: "Synthetic Training Generation", desc: "DeepSeek Coder + CodeLlama generate synthetic log examples demonstrating new attack patterns. Qwen 2.5 generates multilingual variants. Falcon 180B validates and labels the synthetic data." },
  { phase: "04", title: "Adversarial Validation", desc: "CAI filter screens all synthetic training data. Red-team agent attempts to find examples that could teach offensive capabilities. Flagged examples are discarded." },
  { phase: "05", title: "LoRA Fine-Tuning", desc: "Target models are updated via LoRA (Low-Rank Adaptation) on the validated delta dataset. Full model weights are never overwritten — LoRA adapters are versioned and rollback-capable." },
  { phase: "06", title: "Evaluation & Regression Testing", desc: "Updated models run against a golden benchmark of known threats. If F1 detection score drops > 2%, the adapter is rejected. If it improves, it's merged." },
  { phase: "07", title: "Knowledge Graph Update", desc: "New threat actors, TTPs, and campaigns are added to the system's Neo4j knowledge graph. Relationships are automatically extracted by Falcon 180B from threat reports." },
  { phase: "08", title: "YARA / Sigma Rule Auto-Update", desc: "DeepSeek Coder generates new detection rules from novel malware samples. Rules pass through a community validation simulation before deployment to the detection stack." },
];

const PARAM_BUDGET = [
  { model: "Falcon 180B", params: 180, color: "#FF2D55" },
  { model: "Qwen 2.5 72B", params: 72, color: "#FFD60A" },
  { model: "Mistral 8×7B", params: 56, color: "#FF6B35" },
  { model: "CodeLlama 34B", params: 34, color: "#FF9500" },
  { model: "WizardCoder 34B", params: 34, color: "#BF5AF2" },
  { model: "Phi-3 Medium 14B", params: 14, color: "#7B61FF" },
  { model: "Vigil / LlamaGuard 7B", params: 7, color: "#FF3B30" },
  { model: "Orca 2 13B", params: 13, color: "#30D158" },
  { model: "OpenChat 3.5 7B", params: 7, color: "#5AC8FA" },
  { model: "Zephyr 7B", params: 7, color: "#A2845E" },
  { model: "DeepSeek Coder Lite 16B", params: 16, color: "#0AC4FF" },
  { model: "SecBERT / CyBERT", params: 0.11, color: "#00FFB2" },
];

const totalParams = PARAM_BUDGET.reduce((a, b) => a + b.params, 0);

const LAYER_ORDER = ["safety", "ingestion", "detection", "intel", "analysis", "engineering", "hunting", "response", "compliance", "interface"];
const LAYER_LABELS = {
  safety: "⚔ Guardrails", ingestion: "↓ Ingestion", detection: "🔍 Detection",
  intel: "🌐 Threat Intel", analysis: "🧬 Deep Analysis", engineering: "🛠 Engineering",
  hunting: "🎯 Hunting", response: "🚨 Response", compliance: "📋 Compliance", interface: "💬 Interface"
};

export default function App() {
  const [tab, setTab] = useState("overview");
  const [selectedModel, setSelectedModel] = useState(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(iv);
  }, []);

  const tabs = [
    { id: "overview", label: "System Overview" },
    { id: "models", label: "Expert Models" },
    { id: "routing", label: "MoE Router" },
    { id: "intel", label: "Threat Intel Pipeline" },
    { id: "self", label: "Self-Improvement Loop" },
    { id: "cai", label: "CAI & Guardrails" },
    { id: "budget", label: "Parameter Budget" },
    { id: "deploy", label: "Deployment Guide" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#080C10",
      fontFamily: "'Courier New', 'Consolas', monospace",
      color: "#C8D8E8",
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
      }} />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1A2A3A",
        padding: "16px 24px",
        background: "linear-gradient(135deg, #080C10 0%, #0D1820 100%)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: pulse ? "#00FF88" : "#007A44",
            boxShadow: pulse ? "0 0 12px #00FF88" : "none",
            transition: "all 0.3s",
          }} />
          <div>
            <div style={{ fontSize: 11, color: "#4A6A8A", letterSpacing: 4, textTransform: "uppercase" }}>
              CLASSIFIED // BLUE TEAM OPERATIONS
            </div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#00FFB2", letterSpacing: 2 }}>
              SENTINEL-MoE // Open-Source SOC Intelligence Platform
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 11, color: "#4A6A8A" }}>
            <span>MODELS: <span style={{ color: "#00FFB2" }}>12</span></span>
            <span>PARAMS: <span style={{ color: "#FF6B35" }}>{totalParams.toFixed(1)}B / 500B</span></span>
            <span>STATUS: <span style={{ color: "#00FF88" }}>OPERATIONAL</span></span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginTop: 12, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "6px 14px", fontSize: 11, letterSpacing: 1,
              background: tab === t.id ? "#0D2A1A" : "transparent",
              color: tab === t.id ? "#00FFB2" : "#4A6A8A",
              border: tab === t.id ? "1px solid #00FFB2" : "1px solid #1A2A3A",
              cursor: "pointer", textTransform: "uppercase",
              transition: "all 0.2s",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div>
            <SectionTitle>SENTINEL-MoE Architecture Overview</SectionTitle>
            <p style={{ color: "#7A9AB8", lineHeight: 1.8, marginBottom: 24, maxWidth: 900 }}>
              A Mixture-of-Experts (MoE) blue team platform built entirely from open-source LLMs.
              Designed for resource-constrained organizations, national CERTs, and developing nations
              that cannot afford commercial solutions like Darktrace. Self-updating from real threat
              intelligence. Constitutionally constrained to defensive operations only.
            </p>

            {/* Architecture Flow */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
              {[
                { label: "0. GUARDRAILS (Always-On)", color: "#FF3B30", models: "VigilLLM / Llama Guard 2", desc: "Wraps every model call. Blocks offensive use. Prevents prompt injection." },
                { label: "1. INGESTION LAYER", color: "#00FFB2", models: "SecBERT / CyBERT", desc: "Raw data → typed entities, severity triage, routing tokens (0.11B — always resident)" },
                { label: "2. ROUTING LAYER", color: "#4A6A8A", models: "MoE Router (custom orchestrator)", desc: "Routes each query to 1-3 expert models based on task classification" },
                { label: "3A. DETECTION (real-time)", color: "#FF6B35", models: "Mistral 8×7B + Phi-3", desc: "High-throughput threat scoring, anomaly detection, endpoint telemetry" },
                { label: "3B. THREAT INTEL", color: "#FFD60A", models: "Qwen 2.5 72B", desc: "Multilingual dark/clearweb intel ingestion, actor tracking, IOC correlation" },
                { label: "4A. DEEP ANALYSIS (escalated)", color: "#FF2D55", models: "Falcon 180B", desc: "Full forensics, kill-chain, APT attribution — called for priority-1 incidents only" },
                { label: "4B. RULE GENERATION", color: "#0AC4FF", models: "DeepSeek Coder + CodeLlama", desc: "YARA/Sigma/KQL/SPL rule generation, detection engineering, SOAR automation" },
                { label: "4C. THREAT HUNTING", color: "#BF5AF2", models: "WizardCoder 34B", desc: "Proactive hunt queries, hypothesis generation, dwell time detection" },
                { label: "5. RESPONSE COORDINATION", color: "#30D158", models: "Orca 2 (IR Reasoning)", desc: "Containment decisions, IR playbook orchestration, root cause analysis" },
                { label: "6. COMPLIANCE CHECK", color: "#A2845E", models: "Zephyr 7B", desc: "ISO27001 / NIST / GDPR compliance review of all actions and reports" },
                { label: "7. HUMAN INTERFACE", color: "#5AC8FA", models: "OpenChat 3.5", desc: "Natural language SOC interface, tiered briefings (executive → technical)" },
                { label: "8. SELF-IMPROVEMENT LOOP", color: "#7B61FF", models: "All models + LoRA adapters", desc: "Continuous fine-tuning from new threat intel, synthetic data generation, eval regression" },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "220px 1fr 2fr",
                  gap: 12, padding: "10px 16px", alignItems: "center",
                  borderLeft: `3px solid ${row.color}`,
                  background: "#0A1018",
                  marginBottom: 1,
                }}>
                  <div style={{ fontSize: 10, color: row.color, letterSpacing: 1 }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: "#C8D8E8" }}>{row.models}</div>
                  <div style={{ fontSize: 11, color: "#7A9AB8" }}>{row.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: 16, border: "1px solid #1A2A3A", background: "#0A1018" }}>
              <div style={{ fontSize: 10, color: "#4A6A8A", letterSpacing: 2, marginBottom: 8 }}>KEY DESIGN PRINCIPLES</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  ["Open Source Only", "Zero licensing cost. Every model is freely available from HuggingFace."],
                  ["Quantized Deployment", "4-bit GPTQ/AWQ enables running on commodity hardware clusters."],
                  ["Sparse Activation", "Only 2-3 experts active per query — linear cost, exponential coverage."],
                  ["Self-Contained", "No mandatory cloud dependencies. Runs fully air-gapped if needed."],
                  ["Federated Updates", "Threat intel sync can be one-way (pull only) for high-security environments."],
                  ["CAI Safety", "Constitutional AI principles prevent weaponization of the platform."],
                ].map(([title, desc], i) => (
                  <div key={i} style={{ padding: 12, background: "#080C10", border: "1px solid #1A2A3A" }}>
                    <div style={{ fontSize: 11, color: "#00FFB2", marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 10, color: "#7A9AB8", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODELS TAB */}
        {tab === "models" && (
          <div>
            <SectionTitle>Expert Model Registry</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {MODELS.map(m => (
                <div key={m.id}
                  onClick={() => setSelectedModel(selectedModel?.id === m.id ? null : m)}
                  style={{
                    padding: 16, background: "#0A1018",
                    border: `1px solid ${selectedModel?.id === m.id ? m.color : "#1A2A3A"}`,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, color: m.color, fontWeight: "bold" }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: "#4A6A8A", letterSpacing: 1, marginTop: 2 }}>{m.role.toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#C8D8E8" }}>{m.params}</div>
                      <div style={{ fontSize: 10, color: "#4A6A8A" }}>VRAM: {m.vram}</div>
                    </div>
                  </div>

                  {selectedModel?.id === m.id && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: "#C8D8E8", lineHeight: 1.7, marginBottom: 12 }}>{m.desc}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 9, color: "#4A6A8A", letterSpacing: 2, marginBottom: 4 }}>INPUTS</div>
                          {m.inputs.map(i => <div key={i} style={{ fontSize: 10, color: "#7A9AB8", padding: "2px 0" }}>→ {i}</div>)}
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#4A6A8A", letterSpacing: 2, marginBottom: 4 }}>OUTPUTS</div>
                          {m.outputs.map(o => <div key={o} style={{ fontSize: 10, color: "#7A9AB8", padding: "2px 0" }}>← {o}</div>)}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 10, color: "#4A6A8A" }}>
                        Quantization: <span style={{ color: m.color }}>{m.quant}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 8, height: 2, background: "#1A2A3A" }}>
                    <div style={{
                      height: "100%", width: `${(parseFloat(m.params) / 180) * 100}%`,
                      background: m.color, minWidth: 2,
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "#4A6A8A" }}>Click any model to expand details.</div>
          </div>
        )}

        {/* ROUTING TAB */}
        {tab === "routing" && (
          <div>
            <SectionTitle>MoE Router — Orchestration Logic</SectionTitle>
            <p style={{ color: "#7A9AB8", lineHeight: 1.8, marginBottom: 20, maxWidth: 800 }}>
              The MoE router is a lightweight custom orchestrator (FastAPI + asyncio). It classifies
              each incoming query/event and activates 1-3 expert models. This keeps active VRAM usage
              low while maintaining full coverage across all threat scenarios.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                {
                  trigger: "Raw Log / Event Stream", color: "#00FFB2",
                  chain: ["SecBERT (always)", "→ Score ≥ 7: Mistral 8×7B", "→ Score ≥ 9: + Phi-3 (if endpoint)", "→ Score = 10/Priority-1: + Falcon 180B"],
                  note: "Typical active cost: 13-14B params"
                },
                {
                  trigger: "Threat Intel Feed (new IOC)", color: "#FFD60A",
                  chain: ["Qwen 2.5 (translate + contextualize)", "→ DeepSeek Coder (generate YARA/Sigma)", "→ CodeLlama (integrate into detection stack)", "→ Zephyr (compliance review)"],
                  note: "Typical active cost: ~115B params (sequential)"
                },
                {
                  trigger: "Analyst Natural Language Query", color: "#5AC8FA",
                  chain: ["VigilLLM guard check", "→ OpenChat 3.5 (interpret intent)", "→ WizardCoder (generate hunt query) if hunting", "→ Orca 2 (IR context) if incident", "→ OpenChat (format response)"],
                  note: "Typical active cost: 7-48B params"
                },
                {
                  trigger: "Priority-1 Incident Escalation", color: "#FF2D55",
                  chain: ["Falcon 180B (full forensic analysis)", "→ Orca 2 (IR coordination)", "→ CodeLlama (automated response scripts)", "→ Zephyr (regulatory disclosure check)", "→ OpenChat (executive briefing)"],
                  note: "Full pipeline — all heavy models"
                },
                {
                  trigger: "Endpoint Anomaly (EDR alert)", color: "#7B61FF",
                  chain: ["SecBERT (classify)", "→ Phi-3 (endpoint analysis)", "→ Mistral (correlate with network)", "→ WizardCoder (hunt for lateral movement)"],
                  note: "Typical active cost: ~80B params"
                },
                {
                  trigger: "Malware Sample Submitted", color: "#0AC4FF",
                  chain: ["VigilLLM (verify not generating malware)", "→ DeepSeek Coder (static analysis)", "→ Falcon 180B (deep behavior prediction)", "→ DeepSeek Coder (generate YARA rule)", "→ CodeLlama (deploy to detection stack)"],
                  note: "Code-heavy pipeline"
                },
              ].map((route, i) => (
                <div key={i} style={{ padding: 16, background: "#0A1018", border: `1px solid #1A2A3A`, borderTop: `2px solid ${route.color}` }}>
                  <div style={{ fontSize: 11, color: route.color, marginBottom: 8, letterSpacing: 1 }}>TRIGGER: {route.trigger.toUpperCase()}</div>
                  {route.chain.map((step, j) => (
                    <div key={j} style={{ fontSize: 10, color: j === 0 ? "#C8D8E8" : "#7A9AB8", padding: "3px 0", paddingLeft: j > 0 ? 12 : 0 }}>
                      {step}
                    </div>
                  ))}
                  <div style={{ marginTop: 8, fontSize: 9, color: "#4A6A8A", borderTop: "1px solid #1A2A3A", paddingTop: 6 }}>
                    {route.note}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: 16, background: "#0A1018", border: "1px solid #1A2A3A" }}>
              <div style={{ fontSize: 10, color: "#4A6A8A", letterSpacing: 2, marginBottom: 8 }}>ROUTER IMPLEMENTATION STACK</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[
                  ["Orchestrator", "FastAPI + asyncio, Python 3.11"],
                  ["Model Serving", "vLLM (PagedAttention) for all models"],
                  ["Queue", "Redis + Celery for async routing"],
                  ["Knowledge Graph", "Neo4j (threat actor relationships)"],
                  ["Vector Store", "ChromaDB / Qdrant for embedding search"],
                  ["STIX/TAXII", "OpenCTI for normalized threat intel"],
                  ["Rule Engine", "Sigma + YARA-Python integration"],
                  ["Monitoring", "Prometheus + Grafana for model latency"],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: 10, background: "#080C10", border: "1px solid #1A2A3A" }}>
                    <div style={{ fontSize: 9, color: "#4A6A8A", marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 10, color: "#C8D8E8" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* THREAT INTEL TAB */}
        {tab === "intel" && (
          <div>
            <SectionTitle>Threat Intelligence Pipeline</SectionTitle>
            <p style={{ color: "#7A9AB8", lineHeight: 1.8, marginBottom: 20, maxWidth: 800 }}>
              Fully automated ingestion from {THREAT_INTEL_SOURCES.length} clearnet and dark web sources.
              All feeds normalized to STIX 2.1. Dark web access via dedicated Tor proxy (read-only, monitored).
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {THREAT_INTEL_SOURCES.map((src, i) => (
                <div key={i} style={{
                  padding: 12, background: "#0A1018",
                  borderLeft: `3px solid ${src.type === "darkweb" ? "#FF2D55" : "#00FFB2"}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#C8D8E8" }}>{src.name}</div>
                    <div style={{ fontSize: 9, color: "#4A6A8A", marginTop: 2 }}>{src.category} · {src.update}</div>
                  </div>
                  <div style={{
                    fontSize: 9, padding: "2px 8px",
                    background: src.type === "darkweb" ? "#2A0808" : "#0A1A0A",
                    color: src.type === "darkweb" ? "#FF2D55" : "#00FFB2",
                    border: `1px solid ${src.type === "darkweb" ? "#FF2D55" : "#00FFB2"}`,
                  }}>
                    {src.type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 16, background: "#0A1018", border: "1px solid #1A2A3A" }}>
                <div style={{ fontSize: 10, color: "#FF2D55", letterSpacing: 2, marginBottom: 8 }}>DARK WEB ACCESS ARCHITECTURE</div>
                {[
                  "Dedicated Tor proxy container (isolated Docker network)",
                  "Read-only crawlers — no posting, no registration",
                  "All dark web traffic logged and audited by VigilLLM",
                  "Data exfiltration prevention: uni-directional data flow only",
                  "Qwen 2.5 translates all non-English content in-memory",
                  "Tor circuit rotation every 10 minutes",
                  "Dead man's switch: auto-shutdown on anomalous outbound traffic",
                ].map((item, i) => (
                  <div key={i} style={{ fontSize: 10, color: "#7A9AB8", padding: "4px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: "#FF2D55" }}>!</span> {item}
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, background: "#0A1018", border: "1px solid #1A2A3A" }}>
                <div style={{ fontSize: 10, color: "#00FFB2", letterSpacing: 2, marginBottom: 8 }}>INTEL PROCESSING PIPELINE</div>
                {[
                  "Raw feed → SecBERT entity extraction",
                  "Entities → STIX 2.1 object creation",
                  "STIX objects → OpenCTI knowledge graph",
                  "New TTPs → MITRE ATT&CK mapping (Qwen 2.5)",
                  "New malware → DeepSeek Coder YARA generation",
                  "New CVEs → Exposure correlation (Phi-3 endpoint check)",
                  "New actors → Falcon 180B attribution analysis",
                  "All new intel → Self-improvement queue",
                ].map((item, i) => (
                  <div key={i} style={{ fontSize: 10, color: "#7A9AB8", padding: "4px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: "#00FFB2" }}>→</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SELF-IMPROVEMENT TAB */}
        {tab === "self" && (
          <div>
            <SectionTitle>Self-Improvement & Continuous Learning Loop</SectionTitle>
            <p style={{ color: "#7A9AB8", lineHeight: 1.8, marginBottom: 20, maxWidth: 800 }}>
              SENTINEL-MoE continuously updates its knowledge without human intervention.
              All updates are safety-validated before deployment. Models never forget existing
              knowledge — only LoRA adapters are updated, with full rollback capability.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              {SELF_IMPROVEMENT.map((phase, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "60px 1fr",
                  gap: 16, padding: 16, background: "#0A1018",
                  border: "1px solid #1A2A3A",
                  borderLeft: "3px solid #7B61FF",
                }}>
                  <div style={{
                    fontSize: 24, color: "#7B61FF", fontWeight: "bold",
                    lineHeight: 1,
                  }}>{phase.phase}</div>
                  <div>
                    <div style={{ fontSize: 12, color: "#C8D8E8", marginBottom: 4 }}>{phase.title}</div>
                    <div style={{ fontSize: 11, color: "#7A9AB8", lineHeight: 1.7 }}>{phase.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 16, background: "#0A0A14", border: "1px solid #7B61FF" }}>
              <div style={{ fontSize: 10, color: "#7B61FF", letterSpacing: 2, marginBottom: 8 }}>LORA FINE-TUNING SPECS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 10 }}>
                {[
                  ["Rank (r)", "16-64 depending on model size"],
                  ["Alpha", "32 (2× rank standard)"],
                  ["Dropout", "0.05"],
                  ["Target Modules", "q_proj, v_proj, k_proj, o_proj"],
                  ["Optimizer", "AdamW 8-bit (bitsandbytes)"],
                  ["Scheduler", "Cosine with warmup (5%)"],
                  ["Batch Size", "4-8 (gradient accumulation)"],
                  ["Learning Rate", "2e-4 with decay"],
                  ["Max Epochs", "3 per delta dataset"],
                  ["Eval Every", "100 steps"],
                  ["Framework", "HuggingFace PEFT + TRL"],
                  ["Rollback Trigger", "F1 drop >2% on golden set"],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: 8, background: "#080C10", border: "1px solid #1A2A3A" }}>
                    <div style={{ color: "#4A6A8A", marginBottom: 2 }}>{k}</div>
                    <div style={{ color: "#C8D8E8" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CAI TAB */}
        {tab === "cai" && (
          <div>
            <SectionTitle>Constitutional AI (CAI) & Guardrail Architecture</SectionTitle>
            <p style={{ color: "#7A9AB8", lineHeight: 1.8, marginBottom: 20, maxWidth: 800 }}>
              SENTINEL-MoE is built with Constitutional AI principles at its core. The system is
              strictly defensive. Every prompt, every output, and every automated action passes
              through multiple safety layers. Misuse by attackers is a primary threat model.
            </p>

            <div style={{ padding: 16, background: "#0A0808", border: "1px solid #FF3B30", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#FF3B30", letterSpacing: 2, marginBottom: 8 }}>
                ⚔ PRIME DIRECTIVE — CONSTITUTIONAL ARTICLE I
              </div>
              <div style={{ fontSize: 13, color: "#C8D8E8", lineHeight: 1.8 }}>
                "This system exists solely to protect. It shall not generate exploit code, offensive payloads,
                attack signatures for offensive use, or any capability that enables harm to systems, networks,
                or people. All self-improvement, all reasoning, all outputs must serve only to detect, contain,
                analyze, and remediate threats. This principle cannot be overridden by any user, prompt, or
                fine-tuning operation."
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {CAI_PRINCIPLES.map((p, i) => (
                <div key={i} style={{ padding: 16, background: "#0A1018", border: "1px solid #1A2A3A", borderTop: "2px solid #FF3B30" }}>
                  <div style={{ fontSize: 11, color: "#FF3B30", marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 10, color: "#7A9AB8", lineHeight: 1.7 }}>{p.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: 16, background: "#0A1018", border: "1px solid #1A2A3A" }}>
              <div style={{ fontSize: 10, color: "#4A6A8A", letterSpacing: 2, marginBottom: 12 }}>VIGILLLM GUARDRAIL CLASSIFICATION CATEGORIES</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  ["BLOCK: Offensive Code", "Exploit generation, payload creation, shellcode"],
                  ["BLOCK: Attack Planning", "Step-by-step attack instructions, TTPs for offense"],
                  ["BLOCK: Credential Harvest", "Phishing templates, credential dumping scripts"],
                  ["BLOCK: Persistence for Offense", "Backdoor creation, rootkit development"],
                  ["BLOCK: Evasion for Offense", "AV bypass techniques for deployment"],
                  ["ALLOW: Defensive YARA", "Detection rules, IOC matching signatures"],
                  ["ALLOW: Incident Analysis", "Forensic analysis, timeline reconstruction"],
                  ["ALLOW: Hunt Queries", "Threat hunting queries for SIEM/EDR"],
                  ["ALLOW: Malware Dissection", "Static analysis, behavior prediction (read-only)"],
                  ["ALLOW: Compliance Docs", "Policy documentation, audit reports"],
                  ["ALLOW: IR Playbooks", "Response procedures, containment steps"],
                  ["FLAG: Dual-Use", "Sent to human review queue for analyst decision"],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    padding: 10, background: "#080C10", border: "1px solid #1A2A3A",
                    borderLeft: `3px solid ${k.startsWith("BLOCK") ? "#FF3B30" : k.startsWith("ALLOW") ? "#30D158" : "#FFD60A"}`,
                  }}>
                    <div style={{ fontSize: 9, color: k.startsWith("BLOCK") ? "#FF3B30" : k.startsWith("ALLOW") ? "#30D158" : "#FFD60A", marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 9, color: "#7A9AB8" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BUDGET TAB */}
        {tab === "budget" && (
          <div>
            <SectionTitle>Parameter Budget Analysis — {totalParams.toFixed(1)}B / 500B</SectionTitle>
            <div style={{ marginBottom: 16, padding: 12, background: "#0A1A0A", border: "1px solid #30D158" }}>
              <span style={{ color: "#30D158", fontSize: 12 }}>✓ WITHIN BUDGET </span>
              <span style={{ color: "#7A9AB8", fontSize: 11 }}>
                Total: {totalParams.toFixed(1)}B params · Headroom: {(500 - totalParams).toFixed(1)}B ·
                With 4-bit quantization: ~{(totalParams * 0.5).toFixed(0)}GB storage
              </span>
            </div>

            {/* Bar chart */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4 }}>
              {PARAM_BUDGET.sort((a, b) => b.params - a.params).map((m, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "200px 1fr 80px", gap: 8, alignItems: "center" }}>
                  <div style={{ fontSize: 10, color: "#C8D8E8", textAlign: "right" }}>{m.model}</div>
                  <div style={{ height: 20, background: "#0A1018", position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      width: `${(m.params / 180) * 100}%`,
                      background: m.color, opacity: 0.8,
                      minWidth: m.params > 0 ? 2 : 0,
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: m.color }}>{m.params}B</div>
                </div>
              ))}
              {/* Budget line */}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 80px", gap: 8, alignItems: "center", marginTop: 8 }}>
                <div style={{ fontSize: 10, color: "#4A6A8A", textAlign: "right" }}>TOTAL</div>
                <div style={{ height: 20, background: "#0A1018", position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, height: "100%",
                    width: `${(totalParams / 500) * 100}%`,
                    background: "linear-gradient(90deg, #00FFB2, #FFD60A)",
                  }} />
                  <div style={{
                    position: "absolute", right: 0, top: 0, height: "100%",
                    width: "2px", background: "#FF3B30",
                  }} />
                </div>
                <div style={{ fontSize: 10, color: "#00FFB2" }}>{totalParams.toFixed(1)}B / 500B</div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 16, background: "#0A1018", border: "1px solid #1A2A3A" }}>
                <div style={{ fontSize: 10, color: "#4A6A8A", letterSpacing: 2, marginBottom: 8 }}>VRAM REQUIREMENTS (4-bit)</div>
                {[
                  ["Falcon 180B", "~90 GB", "2× A100 80GB or 4× A40"],
                  ["Qwen 2.5 72B", "~36 GB", "1× A100 80GB or 2× A40"],
                  ["Mistral 8×7B", "~28 GB", "1× A100 40GB"],
                  ["CodeLlama 34B", "~17 GB", "1× A6000 or RTX 4090"],
                  ["WizardCoder 34B", "~17 GB", "1× A6000 or RTX 4090"],
                  ["VigilLLM (FP16)", "~14 GB", "Dedicated — always-on"],
                  ["Phi-3 Medium", "~8 GB", "1× RTX 3090/4080"],
                  ["Orca 2 13B", "~7 GB", "1× RTX 3080"],
                  ["Others (×4)", "~18 GB total", "Shared inference node"],
                ].map(([model, vram, hw]) => (
                  <div key={model} style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 8, padding: "4px 0", fontSize: 10, borderBottom: "1px solid #1A2A3A" }}>
                    <span style={{ color: "#C8D8E8" }}>{model}</span>
                    <span style={{ color: "#FFD60A" }}>{vram}</span>
                    <span style={{ color: "#7A9AB8" }}>{hw}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, background: "#0A1018", border: "1px solid #1A2A3A" }}>
                <div style={{ fontSize: 10, color: "#4A6A8A", letterSpacing: 2, marginBottom: 8 }}>MINIMUM VIABLE DEPLOYMENT</div>
                {[
                  ["Tier 1 (National CERT)", "8× A100 80GB (~$500K hardware)", "Full system, all models concurrent"],
                  ["Tier 2 (Ministry/Agency)", "4× A100 + 4× A40 (~$200K)", "Falcon 180B on-demand only"],
                  ["Tier 3 (SME/NGO)", "2× A100 80GB (~$60K)", "Exclude Falcon, use Mixtral for analysis"],
                  ["Tier 4 (Air-gapped)", "4× RTX 4090 cluster (~$15K)", "Quantized 4-bit, Falcon via API"],
                  ["Cloud Option", "AWS/GCP A100 spot instances", "$3-8/hr depending on load"],
                ].map(([tier, hw, cap]) => (
                  <div key={tier} style={{ padding: "8px 0", borderBottom: "1px solid #1A2A3A" }}>
                    <div style={{ fontSize: 10, color: "#00FFB2" }}>{tier}</div>
                    <div style={{ fontSize: 10, color: "#C8D8E8" }}>{hw}</div>
                    <div style={{ fontSize: 9, color: "#4A6A8A" }}>{cap}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DEPLOY TAB */}
        {tab === "deploy" && (
          <div>
            <SectionTitle>Deployment Guide</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                {[
                  {
                    title: "1. Infrastructure Setup",
                    color: "#00FFB2",
                    steps: [
                      "Install Ubuntu 22.04 LTS on all nodes",
                      "Install NVIDIA drivers + CUDA 12.1+",
                      "Install Docker + NVIDIA Container Toolkit",
                      "Set up Kubernetes cluster (K3s for small deployments)",
                      "Configure internal DNS and network isolation",
                      "Set up Tor proxy container (isolated network namespace)",
                    ]
                  },
                  {
                    title: "2. Model Download & Quantization",
                    color: "#FF6B35",
                    steps: [
                      "pip install huggingface-hub auto-gptq bitsandbytes",
                      "Download models from HuggingFace Hub",
                      "Quantize to 4-bit GPTQ (use AutoGPTQ library)",
                      "Verify checksums against HF model cards",
                      "Store in shared NFS volume accessible to all nodes",
                      "Test each model independently before integration",
                    ]
                  },
                  {
                    title: "3. vLLM Serving Setup",
                    color: "#7B61FF",
                    steps: [
                      "pip install vllm",
                      "Deploy each model as separate vLLM instance",
                      "Configure tensor parallelism for large models",
                      "Set up model-specific ports (8001-8012)",
                      "Configure PagedAttention memory limits",
                      "Set up health check endpoints for each model",
                    ]
                  },
                  {
                    title: "4. Orchestrator Deployment",
                    color: "#0AC4FF",
                    steps: [
                      "Clone SENTINEL-MoE orchestrator repo",
                      "Configure model endpoints in config.yaml",
                      "Set up Redis for async task queuing",
                      "Deploy Neo4j knowledge graph",
                      "Deploy ChromaDB / Qdrant vector store",
                      "Configure OpenCTI for STIX/TAXII ingestion",
                    ]
                  },
                ].map(section => (
                  <div key={section.title} style={{ marginBottom: 16, padding: 16, background: "#0A1018", border: `1px solid #1A2A3A`, borderTop: `2px solid ${section.color}` }}>
                    <div style={{ fontSize: 11, color: section.color, marginBottom: 8 }}>{section.title}</div>
                    {section.steps.map((step, i) => (
                      <div key={i} style={{ fontSize: 10, color: "#7A9AB8", padding: "3px 0", display: "flex", gap: 8 }}>
                        <span style={{ color: section.color }}>{String(i + 1).padStart(2, "0")}</span> {step}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div>
                {[
                  {
                    title: "5. SIEM & Data Source Integration",
                    color: "#FFD60A",
                    steps: [
                      "Configure Elastic/Splunk/Wazuh log forwarding to SENTINEL",
                      "Set up Zeek/Suricata network sensor feeds",
                      "Connect EDR (Wazuh/OSQuery) telemetry streams",
                      "Configure threat intel feed URLs in intel_config.yaml",
                      "Set crawl intervals per source (15min - 24hr)",
                      "Test STIX object creation from first ingestion run",
                    ]
                  },
                  {
                    title: "6. VigilLLM Guardrail Configuration",
                    color: "#FF3B30",
                    steps: [
                      "Deploy VigilLLM as API gateway (ALWAYS before other models)",
                      "Configure organization policy in policy.yaml",
                      "Set user access tiers (Analyst / Engineer / Admin)",
                      "Enable audit logging to immutable storage",
                      "Configure alert thresholds for misuse attempts",
                      "Run red-team simulation to verify guardrails",
                    ]
                  },
                  {
                    title: "7. System Architecture Ingestion",
                    color: "#BF5AF2",
                    steps: [
                      "Document full network topology in structured JSON",
                      "List all assets: servers, endpoints, cloud resources",
                      "Define trust boundaries and crown jewels",
                      "Load into Falcon 180B system context (system prompt)",
                      "Load asset inventory into Phi-3 endpoint context",
                      "Update Neo4j with organizational asset graph",
                    ]
                  },
                  {
                    title: "8. Self-Improvement Pipeline",
                    color: "#7B61FF",
                    steps: [
                      "Configure golden benchmark dataset for regression testing",
                      "Set up LoRA fine-tuning pipeline (HF PEFT + TRL)",
                      "Configure automatic delta detection thresholds",
                      "Set fine-tuning schedule (nightly by default)",
                      "Configure rollback triggers and version management",
                      "Enable weekly automated red-team simulation",
                    ]
                  },
                ].map(section => (
                  <div key={section.title} style={{ marginBottom: 16, padding: 16, background: "#0A1018", border: `1px solid #1A2A3A`, borderTop: `2px solid ${section.color}` }}>
                    <div style={{ fontSize: 11, color: section.color, marginBottom: 8 }}>{section.title}</div>
                    {section.steps.map((step, i) => (
                      <div key={i} style={{ fontSize: 10, color: "#7A9AB8", padding: "3px 0", display: "flex", gap: 8 }}>
                        <span style={{ color: section.color }}>{String(i + 1).padStart(2, "0")}</span> {step}
                      </div>
                    ))}
                  </div>
                ))}

                <div style={{ padding: 16, background: "#0A0A14", border: "1px solid #7B61FF" }}>
                  <div style={{ fontSize: 10, color: "#7B61FF", letterSpacing: 2, marginBottom: 8 }}>OPEN SOURCE LICENSES — ALL FREE</div>
                  {[
                    ["SecBERT/CyBERT", "Apache 2.0"],
                    ["Mistral 8×7B", "Apache 2.0"],
                    ["Falcon 180B", "Falcon License (research + commercial OK)"],
                    ["Phi-3", "MIT"],
                    ["Qwen 2.5", "Qianwen License (free for research)"],
                    ["DeepSeek Coder", "DeepSeek License (free)"],
                    ["CodeLlama", "Llama 2 Community License"],
                    ["Llama Guard 2", "Llama 2 Community License"],
                    ["Orca 2", "Microsoft Research License"],
                    ["OpenChat 3.5", "Apache 2.0"],
                    ["WizardCoder", "Llama 2 Community License"],
                    ["Zephyr 7B", "MIT"],
                  ].map(([model, lic]) => (
                    <div key={model} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#7A9AB8", padding: "3px 0", borderBottom: "1px solid #0D1820" }}>
                      <span>{model}</span>
                      <span style={{ color: "#30D158" }}>{lic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "16px", fontSize: 9, color: "#2A3A4A", borderTop: "1px solid #1A2A3A" }}>
        SENTINEL-MoE // OPEN-SOURCE BLUE TEAM INTELLIGENCE PLATFORM // DEFENSIVE USE ONLY //
        CONSTITUTIONAL AI COMPLIANT // {totalParams.toFixed(1)}B PARAMETERS // BUILD FOR THOSE WHO CANNOT AFFORD TO BE UNDEFENDED
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, color: "#4A6A8A", letterSpacing: 4, marginBottom: 4 }}>// SENTINEL-MoE ARCHITECTURE</div>
      <div style={{ fontSize: 18, color: "#C8D8E8", fontWeight: "bold", letterSpacing: 1 }}>{children}</div>
      <div style={{ height: 1, background: "linear-gradient(90deg, #00FFB2, transparent)", marginTop: 8 }} />
    </div>
  );
}
