(function (S) {
  const CATEGORY_LABELS = {
    board: "서핑보드",
    wetsuit: "웻슈트",
    accessory: "악세서리/소품",
    all: "전체",
  };

  const apiBase = () => window.location.origin;
  let selectedImageData = "";

  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  async function compressImageFile(file, maxWidth = 1200, quality = 0.82) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  }

  function resetImagePreview() {
    selectedImageData = "";
    const input = document.getElementById("writeImage");
    const preview = document.getElementById("writeImagePreview");
    const previewImg = document.getElementById("writeImagePreviewImg");
    if (input) input.value = "";
    if (previewImg) previewImg.removeAttribute("src");
    preview?.setAttribute("hidden", "");
  }

  function showImagePreview(dataUrl) {
    const preview = document.getElementById("writeImagePreview");
    const previewImg = document.getElementById("writeImagePreviewImg");
    if (!preview || !previewImg) return;
    previewImg.src = dataUrl;
    preview.removeAttribute("hidden");
  }

  S.loadProducts = async function () {
    const grid = document.getElementById("marketCardsGrid");
    if (!grid) return;

    try {
      const response = await fetch(`${apiBase()}/api/products`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const products = await response.json();

      if (!Array.isArray(products) || products.length === 0) {
        grid.innerHTML = '<p class="market-empty">등록된 중고 상품이 없습니다. 첫 상품을 등록해 보세요.</p>';
        return;
      }

      grid.innerHTML = products.map((product) => `
        <article class="product-card">
          ${product.image
            ? `<img class="product-card-image" src="${product.image}" alt="${escapeHtml(product.title)}">`
            : '<div class="product-card-image product-card-image--empty">사진 없음</div>'}
          <span class="badge">${CATEGORY_LABELS[product.category] || product.category}</span>
          <h3>${escapeHtml(product.title)}</h3>
          <p class="price">${Number(product.price).toLocaleString()}원</p>
          <p class="desc">${escapeHtml(product.description || "")}</p>
          <div class="meta">
            <span>판매자: ${escapeHtml(product.seller || "익명 서퍼")}</span>
            <span>${product.createdAt ? new Date(product.createdAt).toLocaleDateString() : ""}</span>
          </div>
        </article>
      `).join("");
    } catch (error) {
      console.error("상품을 불러오지 못했습니다:", error);
      grid.innerHTML = '<p class="market-empty">상품 목록을 불러오지 못했습니다. 터미널에서 npm start 후 http://127.0.0.1:3000 으로 접속해 주세요.</p>';
    }
  };

  S.openMarketWriteModal = function () {
    const modal = document.getElementById("marketWriteModal");
    if (!modal) return;
    modal.classList.add("open");
    document.getElementById("writeTitle")?.focus();
  };

  S.setupMarket = function () {
    const openBtn = document.getElementById("openMarketWriteBtn");
    const form = document.getElementById("marketWriteForm");
    const imageInput = document.getElementById("writeImage");
    const clearImageBtn = document.getElementById("clearWriteImageBtn");

    openBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      S.openMarketWriteModal();
    });

    imageInput?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        resetImagePreview();
        return;
      }

      if (!file.type.startsWith("image/")) {
        S.toast("이미지 파일만 업로드할 수 있습니다.");
        resetImagePreview();
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        S.toast("8MB 이하 사진을 선택해 주세요.");
        resetImagePreview();
        return;
      }

      try {
        selectedImageData = await compressImageFile(file);
        showImagePreview(selectedImageData);
      } catch (error) {
        console.error("이미지 처리 실패:", error);
        S.toast("이미지를 불러오지 못했습니다.");
        resetImagePreview();
      }
    });

    clearImageBtn?.addEventListener("click", () => {
      resetImagePreview();
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const productData = {
        title: document.getElementById("writeTitle").value.trim(),
        category: document.getElementById("writeCategory").value,
        price: Number(document.getElementById("writePrice").value),
        description: document.getElementById("writeDesc").value.trim() || "설명 없음",
        seller: S.state.user?.displayName || S.state.user?.username || "익명 서퍼",
      };

      if (selectedImageData) {
        productData.image = selectedImageData;
      }

      if (!productData.title || !Number.isFinite(productData.price)) {
        S.toast("제목과 가격을 입력해 주세요.");
        return;
      }

      try {
        const response = await fetch(`${apiBase()}/api/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || "상품 등록에 실패했습니다.");
        }

        form.reset();
        resetImagePreview();
        document.getElementById("marketWriteModal")?.classList.remove("open");
        S.toast("상품이 등록되었습니다.");
        S.loadProducts();
      } catch (error) {
        console.error("서버 통신 에러:", error);
        S.toast(error.message || "서버와 연결할 수 없습니다. npm start 실행 후 3000번 포트로 접속해 주세요.");
      }
    });

    S.loadProducts();
  };
})(window.SurfKorea);
