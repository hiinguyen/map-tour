import { describe, expect, it } from 'vitest';
import { normalizeKmlName, parseKmlDocument, type SiteRecord } from './kmlParse.js';
import type { ParsedKmlImport } from './kmlTypes.js';

describe('normalizeKmlName', () => {
  it('khớp chính xác chuỗi NFD và NFC sau khi chuẩn hoá', () => {
    const strNFC = 'Đình làng Ước Lễ'.normalize('NFC');
    const strNFD = 'Đình làng Ước Lễ'.normalize('NFD');
    expect(strNFC).not.toBe(strNFD); // Byte sequence differs
    expect(normalizeKmlName(strNFD)).toBe(normalizeKmlName(strNFC));
  });

  it('bỏ các tiền tố ranh giới', () => {
    expect(normalizeKmlName('ranh giới đền ông')).toBe('đền ông');
    expect(normalizeKmlName('ranh chùa')).toBe('chùa');
    expect(normalizeKmlName('rảnh điếm')).toBe('điếm');
  });
});

describe('parseKmlDocument', () => {
  const dummySite: SiteRecord = {
    id: 'site-1',
    name: 'Đình làng Ước Lễ',
    category: 'Di tích tín ngưỡng',
    position_lat: 20.8265,
    position_lng: 105.8105,
    boundary_source: null,
  };

  it('bỏ đỉnh đóng vòng của polygon', () => {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Đình làng Ước Lễ</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              105.8100,20.8260,0
              105.8110,20.8260,0
              105.8110,20.8270,0
              105.8100,20.8270,0
              105.8100,20.8260,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

    const parsed = parseKmlDocument(kml, 'village-1', 'Làng Ước Lễ', 'test.kml', [dummySite]);
    expect(parsed.matched.length).toBe(1);
    const ring = parsed.matched[0].ring;
    // Closed ring had 5 points, open ring should have 4 points
    expect(ring.length).toBe(4);
    expect(ring[0]).toEqual([20.826, 105.81]);
    expect(ring[ring.length - 1]).toEqual([20.827, 105.81]);
  });

  it('trả kết quả unsupported cho MultiGeometry và không cắt xén thành polygon đơn', () => {
    const kmlMulti = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Khu vực phức hợp</name>
      <MultiGeometry>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>105.81,20.82,0 105.82,20.82,0 105.82,20.83,0 105.81,20.82,0</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </MultiGeometry>
    </Placemark>
  </Document>
</kml>`;

    const parsed = parseKmlDocument(kmlMulti, 'village-1', 'Làng Ước Lễ', 'test.kml', [dummySite]);
    expect(parsed.matched.length).toBe(0);
    expect(parsed.unsupported.length).toBe(1);
    expect(parsed.unsupported[0].placemarkName).toBe('Khu vực phức hợp');
  });

  it('cho kết quả y hệt giữa Document > Document và Document > Folder', () => {
    const kmlDocDoc = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Document>
      <Placemark>
        <name>Đình làng Ước Lễ</name>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>
                105.8100,20.8260,0
                105.8110,20.8260,0
                105.8110,20.8270,0
                105.8100,20.8270,0
                105.8100,20.8260,0
              </coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
    </Document>
  </Document>
</kml>`;

    const kmlDocFolder = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <name>Công trình tâm linh</name>
      <Placemark>
        <name>Đình làng Ước Lễ</name>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>
                105.8100,20.8260,0
                105.8110,20.8260,0
                105.8110,20.8270,0
                105.8100,20.8270,0
                105.8100,20.8260,0
              </coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
    </Folder>
  </Document>
</kml>`;

    const res1 = parseKmlDocument(kmlDocDoc, 'v1', 'Làng Ước Lễ', 'doc.kml', [dummySite]);
    const res2 = parseKmlDocument(kmlDocFolder, 'v1', 'Làng Ước Lễ', 'folder.kml', [dummySite]);

    expect(res1.matched.length).toBe(1);
    expect(res2.matched.length).toBe(1);
    expect(res1.matched[0].siteId).toBe(res2.matched[0].siteId);
    expect(res1.matched[0].ring).toEqual(res2.matched[0].ring);
  });

  it('R13: mọi dòng ambiguous trả selectedSiteId null, không ghi mặc định', () => {
    // Tên polygon là chuỗi con của tên site ("Nhà cổ" nằm trong "Nhà cổ A")
    // nên điểm chỉ đạt 40, đúng ngưỡng "khớp yếu". Hình lại nằm cách site
    // khoảng 300 mét nên không có điểm 100 từ "ghim nằm trong polygon".
    const weakSite: SiteRecord = {
      id: 'site-nha-co-a',
      name: 'Nhà cổ A',
      category: 'Nhà cổ',
      position_lat: 20.8265,
      position_lng: 105.8105,
      boundary_source: null,
    };

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <name>Khoanh vùng</name>
      <Placemark>
        <name>Nhà cổ</name>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>
                105.8125,20.8275,0
                105.8135,20.8275,0
                105.8135,20.8285,0
                105.8125,20.8285,0
                105.8125,20.8275,0
              </coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
    </Folder>
  </Document>
</kml>`;

    const parsed = parseKmlDocument(kml, 'village-1', 'Làng Ước Lễ', 'test.kml', [weakSite]);

    expect(parsed.ambiguous.length).toBeGreaterThan(0);
    for (const item of parsed.ambiguous) {
      expect(item.selectedSiteId).toBeNull();
    }
  });
});
