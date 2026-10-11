import type { ResultCardData } from "./test-result-card";
import type {
  StoredReports,
  TestResultDetail,
} from "@/lib/api/typebox/model-tester";
import type { VerifyResult } from "ai-model-verifier";
import {
  probeColumns,
  storedFindings,
  storedReports,
  toTestResultProbe,
} from "@/lib/api/model-tester-rows";

/** The report-derived fields, the same for a live run and a stored one. */
function fromReports(reports: StoredReports) {
  return {
    ...(reports.signature
      ? {
          signature: {
            state: reports.signature.state,
            signatureLength: reports.signature.signatureLength,
          },
        }
      : {}),
    ...(reports.tokenTruth
      ? { tokenTruth: { ok: reports.tokenTruth.ok } }
      : {}),
    ...(reports.responseMetadata?.notes.length
      ? { envelopeNotes: reports.responseMetadata.notes }
      : {}),
    ...(reports.throughput
      ? { tokensPerSecond: reports.throughput.tokensPerSecond }
      : {}),
    ...(reports.thinkingFloor ? { thinkingFloor: reports.thinkingFloor } : {}),
    ...(reports.survey ? { survey: reports.survey } : {}),
  };
}

export function fromVerifyResult(r: VerifyResult): ResultCardData {
  return {
    model: r.model,
    baseUrlHost: r.baseUrlHost,
    provider: r.vendor,
    verdict: r.verdict,
    reasons: r.reasons,
    versionUnverifiable: r.versionUnverifiable,
    detectedModel: r.detectedModel,
    probesPassed: r.probesPassed,
    probesTotal: r.probesTotal,
    totalTokens: r.totalUsage?.total ?? null,
    latencyMs: r.latencyMs,
    transport: r.transport,
    resolvedFormat: r.resolvedVendor,
    formatFellBack: r.resolvedVendor !== r.vendor,
    connectivityError: r.connectivityError,
    ...fromReports(storedReports(r)),
    findings: storedFindings(r),
    probes: r.probes.map((p) => toTestResultProbe(probeColumns(p))),
  };
}

export function toResultCardData(detail: TestResultDetail): ResultCardData {
  // Rows from before findings were stored rebuild the evidence from the probes.
  const reasons =
    detail.findings.length > 0
      ? detail.findings
          .filter((f) => f.severity !== "note")
          .map((f) => f.reason)
      : detail.probes
          .filter((p) => !p.pass && p.reason)
          .map((p) => `${p.label}: ${p.reason}`);
  return {
    model: detail.model,
    baseUrlHost: detail.baseUrlHost,
    provider: detail.provider,
    verdict: detail.verdict,
    reasons,
    versionUnverifiable: detail.versionUnverifiable,
    detectedModel: detail.detectedModel,
    probesPassed: detail.probesPassed,
    probesTotal: detail.probesTotal,
    totalTokens: detail.totalTokens,
    latencyMs: detail.latencyMs,
    transport: detail.transport,
    resolvedFormat: detail.resolvedFormat,
    formatFellBack: detail.formatFellBack,
    connectivityError: null,
    ...fromReports(detail.reports),
    findings: detail.findings,
    probes: detail.probes,
  };
}
