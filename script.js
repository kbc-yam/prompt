const statusEl = document.getElementById("status");
const listEl = document.getElementById("linkList");

const URL_LINE = /^https?:\/\/\S+$/i;
const POSITION_VALUES = new Set(["left", "center", "right"]);

async function loadLinks() {
  try {
    const response = await fetch("./link.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch link.json: ${response.status}`);
    }

    const rawData = await response.json();
    const links = normalizeLinks(rawData);

    if (links.length === 0) {
      statusEl.textContent = "link.json に有効なリンクが見つかりませんでした";
      return;
    }

    renderLinks(links);
    statusEl.textContent = `${links.length} 件のリンクを表示中`;
    listEl.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    statusEl.textContent = "読み込みに失敗しました。link.json の形式を確認してください。";
  }
}

function normalizeLinks(rawData) {
  if (!Array.isArray(rawData)) {
    throw new Error("link.json must be an array");
  }

  const links = [];
  for (const item of rawData) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const url = typeof item.url === "string" ? item.url.trim() : "";
    if (!URL_LINE.test(url)) {
      continue;
    }

    const label = typeof item.label === "string" && item.label.trim()
      ? item.label.trim()
      : new URL(url).hostname;
    const position = normalizePosition(item.position);
    const width = normalizeWidth(item.width);

    links.push({ label, url, position, width });
  }

  return links;
}

function normalizePosition(position) {
  if (typeof position !== "string") {
    return "center";
  }

  const normalized = position.trim().toLowerCase();
  return POSITION_VALUES.has(normalized) ? normalized : "center";
}

function normalizeWidth(width) {
  if (typeof width !== "string") {
    return "50%";
  }

  const normalized = width.trim().toLowerCase();
  const isPercent = /^\d+(\.\d+)?%$/.test(normalized);
  const isPixel = /^\d+(\.\d+)?px$/.test(normalized);

  if (isPercent || isPixel) {
    return normalized;
  }

  return "50%";
}

function parseWidthToPixels(widthValue, screenWidth) {
  if (widthValue.endsWith("%")) {
    const percent = Number.parseFloat(widthValue.slice(0, -1));
    return Math.floor((screenWidth * percent) / 100);
  }

  return Math.floor(Number.parseFloat(widthValue.slice(0, -2)));
}

function calcWindowLeft(position, screenWidth, popupWidth) {
  if (position === "left") {
    return 0;
  }

  if (position === "right") {
    return Math.max(0, screenWidth - popupWidth);
  }

  return Math.max(0, Math.floor((screenWidth - popupWidth) / 2));
}

function openInSeparateWindow(event, link) {
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;

  let popupWidth = parseWidthToPixels(link.width, screenWidth);
  popupWidth = Math.max(320, Math.min(screenWidth, popupWidth));

  const popupHeight = Math.max(600, Math.floor(window.screen.availHeight * 0.9));
  const popupLeft = calcWindowLeft(link.position, screenWidth, popupWidth);
  const popupTop = Math.max(0, Math.floor((screenHeight - popupHeight) / 2));

  const openedWindow = window.open(
    link.url,
    "linkHubWindow",
    `noopener,noreferrer,width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`
  );

  if (openedWindow) {
    event.preventDefault();
    openedWindow.opener = null;
    openedWindow.focus();
  }
}

function renderLinks(links) {
  const fragment = document.createDocumentFragment();

  for (const link of links) {
    const li = document.createElement("li");
    const anchor = document.createElement("a");
    const titleEl = document.createElement("span");
    const urlEl = document.createElement("span");

    anchor.className = "item";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.addEventListener("click", (event) => openInSeparateWindow(event, link));

    titleEl.className = "item-title";
    titleEl.textContent = link.label;

    urlEl.className = "item-url";
    urlEl.textContent = link.url;

    anchor.append(titleEl, urlEl);
    li.append(anchor);
    fragment.append(li);
  }

  listEl.replaceChildren(fragment);
}

loadLinks();
