import { describe, it, expect } from 'vitest';
import { isDuplicateRing } from './kmlCommit.js';
import type { LatLng } from './geo.js';

// Helper: build a square ring centered at (lat, lng) with side length ~sideLenM metres.
function squareRing(lat: number, lng: number, sideLenM: number): LatLng[] {
  const halfDegLat = (sideLenM / 2) / 111195;
  const halfDegLng = (sideLenM / 2) / (111195 * Math.cos((lat * Math.PI) / 180));
  return [
    [lat - halfDegLat, lng - halfDegLng],
    [lat + halfDegLat, lng - halfDegLng],
    [lat + halfDegLat, lng + halfDegLng],
    [lat - halfDegLat, lng + halfDegLng],
  ];
}

// Approximate area of a square ring in m^2 (just side^2).
function approxAreaM2(sideLenM: number): number {
  return sideLenM * sideLenM;
}

describe('isDuplicateRing', () => {
  // Coordinates modelled on Khu lang co Uoc Le seed data.
  const KHU_LANG_CO_CENTER: LatLng = [20.826192, 105.810758];
  const KHU_LANG_CO_SIDE_M = 156;
  const khuLangCoRing = squareRing(KHU_LANG_CO_CENTER[0], KHU_LANG_CO_CENTER[1], KHU_LANG_CO_SIDE_M);
  const khuLangCoAreaM2 = approxAreaM2(KHU_LANG_CO_SIDE_M); // ~24336 m2

  it('R7 ca 1: vong nho 30 m2 nam trong ranh gioi 24336 m2 - KHONG bi coi la trung', () => {
    const tinyRing = squareRing(KHU_LANG_CO_CENTER[0], KHU_LANG_CO_CENTER[1], 5.5);
    const tinyAreaM2 = approxAreaM2(5.5); // ~30 m2
    expect(isDuplicateRing(tinyRing, tinyAreaM2, khuLangCoRing)).toBe(false);
  });

  it('R7 ca 2: chinh vong Khu lang co nhap lai - BI coi la trung', () => {
    expect(isDuplicateRing(khuLangCoRing, khuLangCoAreaM2, khuLangCoRing)).toBe(true);
  });

  it('R7 ca 3: vong gan bang (dien tich chenh 30%) nam trong nhau - BI coi la trung', () => {
    const similarRing = squareRing(KHU_LANG_CO_CENTER[0], KHU_LANG_CO_CENTER[1], 130);
    const similarAreaM2 = approxAreaM2(130);
    expect(isDuplicateRing(similarRing, similarAreaM2, khuLangCoRing)).toBe(true);
  });

  it('R7 ca 4: dien tich bang nhau nhung trong tam nam NGOAI vong - KHONG bi coi la trung', () => {
    const farRing = squareRing(20.830000, 105.815000, KHU_LANG_CO_SIDE_M);
    expect(isDuplicateRing(farRing, khuLangCoAreaM2, khuLangCoRing)).toBe(false);
  });

  it('R7 ca 5: vong lon gap 3 lan - ti le > 2, KHONG bi coi la trung', () => {
    const bigRing = squareRing(KHU_LANG_CO_CENTER[0], KHU_LANG_CO_CENTER[1], KHU_LANG_CO_SIDE_M * 3);
    const bigAreaM2 = approxAreaM2(KHU_LANG_CO_SIDE_M * 3);
    expect(isDuplicateRing(bigRing, bigAreaM2, khuLangCoRing)).toBe(false);
  });

  it('R7 ca 6: existingRing rong (<3 dinh) - KHONG bi coi la trung', () => {
    const emptyRing: LatLng[] = [[20.826, 105.810], [20.827, 105.811]];
    expect(isDuplicateRing(khuLangCoRing, khuLangCoAreaM2, emptyRing)).toBe(false);
  });

  it('R7 ca 7: skippedDuplicateCount va protectedCount tang doc lap - ham tra boolean', () => {
    // isDuplicateRing la ham thuan; caller tang dung counter tuong ung.
    expect(typeof isDuplicateRing(khuLangCoRing, khuLangCoAreaM2, khuLangCoRing)).toBe('boolean');
  });
});
