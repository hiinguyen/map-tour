// Google Drive "view" links (from cell hyperlinks in the survey workbook) are
// not directly downloadable — this resolves a share link to its file id, then
// fetches the raw bytes via Drive's direct-download endpoint. iPhone photos
// come back as HEIC, which browsers other than Safari can't render, so those
// get transcoded to JPEG via a local ffmpeg (sharp's bundled libheif rejects
// several of the real HEIC files here with "Security limit exceeded" on their
// multi-image containers — ffmpeg's demuxer handles them fine).
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type DownloadedKind = 'anh' | 'ban_ve' | 'video';

export interface DownloadedFile {
  buffer: Buffer;
  extension: string;
  kind: DownloadedKind;
  // Pixel size of the decoded image (null for video/PDF, or when ffprobe
  // can't read it) — used by isEquirectangular() to tell a real 360° photo
  // from an ordinary one instead of trusting the workbook's label.
  width: number | null;
  height: number | null;
}

const HEIC_EXTENSIONS = new Set(['heic', 'heif']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tif', 'tiff']);
const DRAWING_EXTENSIONS = new Set(['pdf']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm']);

export function driveFileId(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  return match ? match[1] : null;
}

function extensionFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (!match) return null;
  const filename = decodeURIComponent(match[1]);
  const ext = filename.split('.').pop();
  return ext ? ext.toLowerCase() : null;
}

function extensionFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg';
  if (buffer.toString('ascii', 0, 4) === '\x89PNG') return 'png';
  if (buffer.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (buffer.toString('ascii', 0, 4) === '%PDF') return 'pdf';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  const brand = buffer.toString('ascii', 4, 12);
  if (brand.startsWith('ftyp') && /he[iv][cx]|mif1/.test(brand)) return 'heic';
  return null;
}

async function transcodeHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `drive-photo-${Date.now()}-${Math.random().toString(36).slice(2)}.heic`);
  const outputPath = `${inputPath}.jpg`;
  await fs.writeFile(inputPath, buffer);
  try {
    await execFileAsync('ffmpeg', ['-y', '-i', inputPath, '-frames:v', '1', '-q:v', '3', outputPath]);
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(inputPath, { force: true });
    await fs.rm(outputPath, { force: true });
  }
}

// Equirectangular 360° photos are always exactly 2:1. Surveyors' "360" cell
// labels are not reliable on their own — several ordinary detail shots (chân
// tảng, bát hương, mái, nền lát gạch) sit on rows whose label or neighbouring
// boilerplate mentions 360, and they were imported as kind='panorama' before
// this check existed (see migrations/014_fix_non_panorama_media_kind.sql).
// Measuring the real pixels is the only signal that separated the two
// cleanly across all six workbooks: every genuine panorama here is 2:1 to
// within a rounding pixel, every false positive was 1.90-2.09.
const EQUIRECTANGULAR_RATIO_TOLERANCE = 0.02;

export function isEquirectangular(file: DownloadedFile): boolean {
  if (file.kind !== 'anh' || !file.width || !file.height) return false;
  return Math.abs(file.width / file.height - 2) <= EQUIRECTANGULAR_RATIO_TOLERANCE;
}

// ffprobe rather than a new image dependency: ffmpeg is already required here
// for the HEIC transcode above, and it reads every format this importer
// accepts. Returns nulls (never throws) so a probe failure only costs the
// panorama classification, not the whole download.
async function probeDimensions(buffer: Buffer, extension: string): Promise<{ width: number | null; height: number | null }> {
  const tmpPath = path.join(os.tmpdir(), `drive-probe-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
  await fs.writeFile(tmpPath, buffer);
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'csv=s=x:p=0',
      tmpPath,
    ]);
    const [width, height] = stdout.trim().split('x').map((value) => Number.parseInt(value, 10));
    return {
      width: Number.isFinite(width) ? width : null,
      height: Number.isFinite(height) ? height : null,
    };
  } catch {
    return { width: null, height: null };
  } finally {
    await fs.rm(tmpPath, { force: true });
  }
}

function classifyKind(extension: string): DownloadedKind | null {
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (DRAWING_EXTENSIONS.has(extension)) return 'ban_ve';
  if (IMAGE_EXTENSIONS.has(extension)) return 'anh';
  return null;
}

// Returns null when the link isn't a downloadable file (Drive interstitial
// page, unrecognized format, or the request failed) — callers log and skip.
export async function downloadDriveFile(fileId: string): Promise<DownloadedFile | null> {
  const response = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, { redirect: 'follow' });
  if (!response.ok) return null;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.startsWith('text/html')) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  // Magic bytes (actual content) take priority over the Content-Disposition
  // filename: some 360° photos come through with a vendor-specific extension
  // (e.g. Insta360's ".insp") that isn't a real format — the bytes are a
  // perfectly ordinary equirectangular JPEG underneath, but trusting the
  // filename rejected them outright. Magic-byte sniffing doesn't cover video
  // containers, so those still fall through to the filename extension.
  const extension = extensionFromMagicBytes(buffer) ?? extensionFromContentDisposition(response.headers.get('content-disposition'));
  if (!extension) return null;

  if (HEIC_EXTENSIONS.has(extension)) {
    const jpeg = await transcodeHeicToJpeg(buffer);
    return { buffer: jpeg, extension: 'jpg', kind: 'anh', ...(await probeDimensions(jpeg, 'jpg')) };
  }

  const kind = classifyKind(extension);
  if (!kind) return null;
  const { width, height } = kind === 'anh' ? await probeDimensions(buffer, extension) : { width: null, height: null };
  return { buffer, extension, kind, width, height };
}
