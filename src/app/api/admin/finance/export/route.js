import { getFinanceOverview, toFinanceExportRows } from "@/features/admin/finance";
import { requireSuperAdminContext } from "@/features/admin/server";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

function escapeCsv(value) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request) {
  try {
    await requireSuperAdminContext();
    const params = new URL(request.url).searchParams;
    const report = params.get("report") || "withdrawals";
    const format = params.get("format") || "csv";
    const finance = await getFinanceOverview();
    const rows = toFinanceExportRows(report, finance);
    const headers = Object.keys(rows[0] || { Report: "No data" });
    const separator = format === "xls" ? "\t" : ",";
    const content = [headers, ...rows.map((row) => headers.map((header) => row[header]))]
      .map((row) => row.map(escapeCsv).join(separator))
      .join("\n");
    return new Response(content, {
      headers: {
        "Content-Type": format === "xls" ? "application/vnd.ms-excel; charset=utf-8" : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=serviceflow-${report}.${format === "xls" ? "xls" : "csv"}`
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
