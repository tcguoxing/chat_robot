import { BadRequestException } from '@nestjs/common';
import {
  buildAttachmentContent,
  extractTextContent,
  MAX_TEXT_CHARS_PER_FILE,
  MAX_TOTAL_TEXT_CHARS,
} from './attachments';

const createFile = (
  originalname: string,
  mimetype: string,
  content: Buffer | string,
) => ({
  originalname,
  mimetype,
  buffer: Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'),
});

describe('buildAttachmentContent', () => {
  it('把纯文本附件内容拼进 prompt，并带上文件名', () => {
    const result = buildAttachmentContent([
      createFile('notes.md', 'text/markdown', '# 标题\n正文内容'),
      createFile('data.json', 'application/json', '{"a":1}'),
    ]);

    expect(result.imageParts).toHaveLength(0);
    expect(result.textContent).toContain('【附件 notes.md】');
    expect(result.textContent).toContain('# 标题\n正文内容');
    expect(result.textContent).toContain('【附件 data.json】');
    expect(result.textContent).toContain('{"a":1}');
  });

  it('按扩展名识别文本文件（即使 mimetype 缺失）', () => {
    const result = buildAttachmentContent([
      createFile('README.txt', '', 'hello'),
    ]);

    expect(result.textContent).toContain('hello');
  });

  it('把图片转成 image_url data URI', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const result = buildAttachmentContent([
      createFile('photo.png', 'image/png', png),
    ]);

    expect(result.textContent).toBe('');
    expect(result.imageParts).toHaveLength(1);
    expect(result.imageParts[0].type).toBe('image_url');
    expect(result.imageParts[0].image_url.url).toBe(
      `data:image/png;base64,${png.toString('base64')}`,
    );
  });

  it('遇到不支持的二进制类型时抛 BadRequestException', () => {
    expect(() =>
      buildAttachmentContent([
        createFile('report.pdf', 'application/pdf', Buffer.from('%PDF-1.7')),
      ]),
    ).toThrow(BadRequestException);
  });

  it('单个文本附件超长时截断', () => {
    const longText = 'a'.repeat(MAX_TEXT_CHARS_PER_FILE + 100);
    const result = buildAttachmentContent([
      createFile('big.txt', 'text/plain', longText),
    ]);

    expect(result.textContent).toContain('内容过长已截断');
    expect(result.textContent.length).toBeLessThan(MAX_TEXT_CHARS_PER_FILE + 200);
  });

  it('所有文本附件合计超长时截断，不会无限膨胀', () => {
    const chunk = 'b'.repeat(MAX_TEXT_CHARS_PER_FILE);
    const result = buildAttachmentContent([
      createFile('1.txt', 'text/plain', chunk),
      createFile('2.txt', 'text/plain', chunk),
      createFile('3.txt', 'text/plain', chunk),
      createFile('4.txt', 'text/plain', chunk),
    ]);

    expect(result.textContent.length).toBeLessThan(MAX_TOTAL_TEXT_CHARS + 1000);
    expect(result.textContent).toContain('内容超过长度上限，已忽略');
  });

  it('没有附件时返回空结果', () => {
    expect(buildAttachmentContent()).toEqual({
      textContent: '',
      imageParts: [],
    });
  });
});

describe('extractTextContent', () => {
  it('支持字符串', () => {
    expect(extractTextContent('hello')).toBe('hello');
  });

  it('支持多模态数组', () => {
    expect(
      extractTextContent([
        { type: 'text', text: '你' },
        { type: 'text', text: '好' },
      ]),
    ).toBe('你好');
  });

  it('支持空值', () => {
    expect(extractTextContent(null)).toBe('');
    expect(extractTextContent(undefined)).toBe('');
  });
});
