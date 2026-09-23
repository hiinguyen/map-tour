import { defineConfig } from 'vitest/config';

// Chỉ để test các hàm THUẦN (geo, kiểm định ranh giới, parse KML, khớp tên).
// Không jsdom, không mock database: những module đó cố ý không import pg/env.
// Render MapLibre không nằm trong phạm vi — xem ghi chú ở cuối geo.test.ts.
//
// Vite tự giải import './geo.js' -> './geo.ts' (quy ước NodeNext của nguồn),
// đã kiểm bằng thực nghiệm nên không cần resolve.alias.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
