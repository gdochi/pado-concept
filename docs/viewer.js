const content = document.getElementById("content");
const updatedAt = document.getElementById("updatedAt");
const siteTitle = document.getElementById("siteTitle");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function youtubeInfo(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || "").trim(), location.href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (!(host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com"))) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  let id = "";
  if (host === "youtu.be") id = parts[0] || "";
  else if (url.searchParams.get("v")) id = url.searchParams.get("v") || "";
  else if (["embed", "shorts", "live"].includes(parts[0])) id = parts[1] || "";
  id = id.replace(/[^\w-]/g, "");
  if (!id || id.length < 6) return null;
  const params = new URLSearchParams({ rel: "0", playsinline: "1", origin: location.origin });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function renderMarkdownish(text) {
  return String(text || "").split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("# ")) return `<h2>${escapeHtml(trimmed.slice(2))}</h2>`;
    if (trimmed.startsWith("## ")) return `<h3>${escapeHtml(trimmed.slice(3))}</h3>`;
    const embed = youtubeInfo(trimmed);
    if (embed) {
      const safeUrl = escapeHtml(trimmed);
      return `<p><a href="${safeUrl}" target="_blank" rel="noreferrer">${safeUrl}</a></p><div class="youtube-frame"><iframe src="${escapeHtml(embed)}" title="YouTube video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    }
    return `<p>${escapeHtml(trimmed).replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`)}</p>`;
  }).join("\n");
}

fetch("./content.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error("content.json not found");
    return response.json();
  })
  .then((data) => {
    siteTitle.textContent = data.siteTitle || "파도튜브 개념서";
    updatedAt.textContent = data.updatedAt ? new Date(data.updatedAt).toLocaleString("ko-KR") : "";
    const title = escapeHtml(data.docTitle || data.siteTitle || "파도튜브 개념서");
    const html = data.contentHtml || renderMarkdownish(data.body || "");
    content.innerHTML = `<h1>${title}</h1>${html}`;
    document.title = data.docTitle || data.siteTitle || "파도튜브 개념서";
  })
  .catch((error) => {
    content.innerHTML = `<h1>문서를 불러오지 못했습니다</h1><p>${escapeHtml(error.message)}</p>`;
  });