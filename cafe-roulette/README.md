# HÔM NAY UỐNG GÌ? – CAFE ROULETTE 3D

Web game quay ngẫu nhiên chọn quán cà phê hoặc trà sữa. Làm bằng React + TypeScript + Vite, vòng quay 3D bằng Three.js, animation bằng Framer Motion, âm thanh bằng Web Audio API. Không cần backend hay database.

## Chạy local

Yêu cầu: Node.js 18 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ hiển thị trong terminal (mặc định `http://localhost:5173`).

Build bản production:

```bash
npm run build
npm run preview
```

## Cấu trúc thư mục

```
cafe-roulette/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx              # Điểm vào, mount React
    ├── App.tsx               # Trạng thái game: quay, kết quả, chốt quán, bật/tắt âm
    ├── App.module.css
    ├── index.css             # Nền gradient, biến màu, tắt animation khi reduced motion
    ├── data/
    │   └── shops.ts          # Danh sách 8 quán (không đổi tên, không bỏ quán)
    ├── logic/
    │   └── spin.ts           # Chọn kết quả, tính góc đích, easing, kiểm tra ô dưới kim
    ├── audio/
    │   └── sound.ts          # Âm thanh tổng hợp bằng Web Audio API
    ├── hooks/
    │   └── usePrefersReducedMotion.ts
    └── components/
        ├── Wheel3D.tsx       # Vòng quay 3D (Three.js) + animation xoay
        ├── wheelFace.ts      # Vẽ 8 ô, tên quán và icon lên texture của vòng quay
        ├── ResultModal.tsx   # Popup kết quả: CHỐT QUÁN NÀY! / QUAY LẠI
        ├── Confetti.tsx      # Confetti canvas khi có kết quả
        ├── SpinButton.tsx    # Nút QUAY NGAY!
        ├── Header.tsx        # Tiêu đề và subtitle
        └── Decorations.tsx   # Trang trí nền: hạt cafe, ly nước, ngôi sao
```

## Cơ chế quay

1. Khi nhấn **QUAY NGAY!**, game chọn kết quả trước bằng `crypto.getRandomValues`. Mỗi quán có xác suất bằng nhau (1/8).
2. Tính góc đích: kim chỉ được đặt vào giữa ô đã chọn (có lệch ngẫu nhiên trong ô), và vòng quay xoay thêm 5 vòng.
3. Vòng quay animate tới góc đó trong khoảng 5,2 giây với easing giảm tốc.
4. Khi dừng, kết quả được đọc lại từ ô đang nằm dưới kim, nên luôn khớp với animation.
5. Trong lúc quay, nút bị khóa, không thể nhấn lại.

## Âm thanh

- Click khi nhấn nút, tiếng "tick" khi kim đi qua từng ô, và âm thanh chiến thắng khi có kết quả.
- Âm thanh được tạo bằng Web Audio API, không cần file audio.
- Nút **🔊 / 🔇** ở góc trên bên phải để bật/tắt. Lựa chọn được lưu trong `localStorage` (nếu trình duyệt cho phép).

## Accessibility và hiệu năng

- Khi hệ điều hành bật `prefers-reduced-motion`: thời gian quay rút còn 1 giây, không có tiếng tick, không có confetti, và các animation CSS/Framer Motion bị tắt hoặc giảm.
- Layout dùng `min()`/`clamp()` để chạy tốt từ mobile đến desktop.
- Vòng quay là một canvas WebGL duy nhất, chỉ render lại khi quay hoặc đổi kích thước.
