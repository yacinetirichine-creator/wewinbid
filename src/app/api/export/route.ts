import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import jsPDF from 'jspdf';

// Schema for export request
const ExportSchema = z.object({
  format: z.enum(['pdf', 'pptx', 'docx']),
  title: z.string(),
  content: z.object({
    slides: z.array(z.object({
      id: z.string(),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
      backgroundColor: z.string().optional(),
      layout: z.enum(['title', 'content', 'image', 'two-column', 'blank']).default('content'),
    })).optional(),
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      order: z.number(),
    })).optional(),
    html: z.string().optional(),
  }),
  styles: z.object({
    primaryColor: z.string().default('#4F46E5'),
    secondaryColor: z.string().default('#7C3AED'),
    fontFamily: z.string().default('Helvetica'),
    fontSize: z.number().default(12),
  }).optional(),
  metadata: z.object({
    author: z.string().optional(),
    company: z.string().optional(),
    date: z.string().optional(),
  }).optional(),
});

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 79, g: 70, b: 229 }; // Default indigo
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// Generate PDF document
async function generatePDF(data: z.infer<typeof ExportSchema>): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  const styles = data.styles || { primaryColor: '#4F46E5', secondaryColor: '#7C3AED', fontFamily: 'Helvetica', fontSize: 12 };
  const primaryColor = hexToRgb(styles.primaryColor);

  // Title page
  pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  pdf.rect(0, 0, pageWidth, 60, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.title, margin, 40);

  if (data.metadata?.company) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.metadata.company, margin, 52);
  }

  // Date
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(10);
  pdf.text(
    data.metadata?.date || new Date().toLocaleDateString('fr-FR'),
    margin,
    75
  );

  let yPosition = 90;

  // Content sections
  if (data.content.sections) {
    pdf.setTextColor(0, 0, 0);

    for (const section of data.content.sections) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      // Section title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      pdf.text(section.title, margin, yPosition);
      yPosition += 10;

      // Section content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);

      const cleanContent = stripHtml(section.content);
      const lines = pdf.splitTextToSize(cleanContent, contentWidth);

      for (const line of lines) {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      }

      yPosition += 10; // Space between sections
    }
  }

  // Slides content (for presentations)
  if (data.content.slides) {
    let isFirstSlide = true;

    for (const slide of data.content.slides) {
      if (!isFirstSlide) {
        pdf.addPage();
      }
      isFirstSlide = false;

      // Slide background
      const bgColor = slide.backgroundColor
        ? hexToRgb(slide.backgroundColor)
        : { r: 255, g: 255, b: 255 };
      pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Slide title
      if (slide.title) {
        pdf.setFontSize(slide.layout === 'title' ? 32 : 24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        const titleY = slide.layout === 'title' ? pageHeight / 2 - 20 : 40;
        pdf.text(slide.title, margin, titleY, { maxWidth: contentWidth });
      }

      // Slide subtitle
      if (slide.subtitle) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        const subtitleY = slide.layout === 'title' ? pageHeight / 2 + 10 : 55;
        pdf.text(slide.subtitle, margin, subtitleY, { maxWidth: contentWidth });
      }

      // Slide content
      if (slide.content) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);

        const cleanContent = stripHtml(slide.content);
        const lines = pdf.splitTextToSize(cleanContent, contentWidth);
        let contentY = 75;

        for (const line of lines) {
          if (contentY < pageHeight - 20) {
            pdf.text(line, margin, contentY);
            contentY += 7;
          }
        }
      }
    }
  }

  // HTML content
  if (data.content.html) {
    const cleanContent = stripHtml(data.content.html);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);

    const lines = pdf.splitTextToSize(cleanContent, contentWidth);
    let htmlY = yPosition;

    for (const line of lines) {
      if (htmlY > pageHeight - 20) {
        pdf.addPage();
        htmlY = margin;
      }
      pdf.text(line, margin, htmlY);
      htmlY += 6;
    }
  }

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} / ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
    pdf.text('Généré par WeWinBid', margin, pageHeight - 10);
  }

  return Buffer.from(pdf.output('arraybuffer'));
}

// Generate PPTX (Office Open XML format)
async function generatePPTX(data: z.infer<typeof ExportSchema>): Promise<Buffer> {
  // Import PptxGenJS dynamically
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  const styles = data.styles || { primaryColor: '#4F46E5', secondaryColor: '#7C3AED', fontFamily: 'Helvetica', fontSize: 12 };
  const primaryColor = styles.primaryColor;
  const secondaryColor = styles.secondaryColor;

  // Set presentation properties
  pptx.author = data.metadata?.author || 'WeWinBid';
  pptx.company = data.metadata?.company || '';
  pptx.title = data.title;
  pptx.subject = 'Document généré par WeWinBid';

  // Define master slide
  pptx.defineSlideMaster({
    title: 'WEWINBID_MASTER',
    background: { color: 'FFFFFF' },
    objects: [
      {
        rect: {
          x: 0,
          y: 0,
          w: '100%',
          h: 0.5,
          fill: { color: primaryColor.replace('#', '') },
        },
      },
      {
        text: {
          text: 'WeWinBid',
          options: {
            x: 0.5,
            y: 5.2,
            w: 2,
            h: 0.3,
            fontSize: 8,
            color: '999999',
          },
        },
      },
    ],
  });

  // Title slide
  const titleSlide = pptx.addSlide({ masterName: 'WEWINBID_MASTER' });
  titleSlide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
    fill: {
      type: 'solid',
      color: primaryColor.replace('#', ''),
    },
  });
  titleSlide.addText(data.title, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });

  if (data.metadata?.company) {
    titleSlide.addText(data.metadata.company, {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.5,
      fontSize: 20,
      color: 'FFFFFF',
      align: 'center',
    });
  }

  titleSlide.addText(data.metadata?.date || new Date().toLocaleDateString('fr-FR'), {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: 'FFFFFFCC',
    align: 'center',
  });

  // Content slides
  if (data.content.slides) {
    for (const slide of data.content.slides) {
      const pptSlide = pptx.addSlide({ masterName: 'WEWINBID_MASTER' });

      // Background
      if (slide.backgroundColor) {
        pptSlide.addShape('rect', {
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          fill: { color: slide.backgroundColor.replace('#', '') },
        });
      }

      // Layout-specific content
      switch (slide.layout) {
        case 'title':
          if (slide.title) {
            pptSlide.addText(slide.title, {
              x: 0.5,
              y: 2,
              w: 9,
              h: 1.5,
              fontSize: 40,
              bold: true,
              color: primaryColor.replace('#', ''),
              align: 'center',
              valign: 'middle',
            });
          }
          if (slide.subtitle) {
            pptSlide.addText(slide.subtitle, {
              x: 0.5,
              y: 3.5,
              w: 9,
              h: 0.8,
              fontSize: 20,
              color: '666666',
              align: 'center',
            });
          }
          break;

        case 'image':
          if (slide.title) {
            pptSlide.addText(slide.title, {
              x: 0.5,
              y: 0.7,
              w: 9,
              h: 0.6,
              fontSize: 28,
              bold: true,
              color: primaryColor.replace('#', ''),
            });
          }
          if (slide.imageUrl) {
            try {
              pptSlide.addImage({
                path: slide.imageUrl,
                x: 1,
                y: 1.5,
                w: 8,
                h: 3.5,
              });
            } catch (e) {
              // If image fails, add placeholder text
              pptSlide.addText('Image non disponible', {
                x: 1,
                y: 2.5,
                w: 8,
                h: 1,
                fontSize: 14,
                color: '999999',
                align: 'center',
              });
            }
          }
          break;

        case 'two-column':
          if (slide.title) {
            pptSlide.addText(slide.title, {
              x: 0.5,
              y: 0.7,
              w: 9,
              h: 0.6,
              fontSize: 28,
              bold: true,
              color: primaryColor.replace('#', ''),
            });
          }
          if (slide.content) {
            const parts = slide.content.split('|||');
            pptSlide.addText(stripHtml(parts[0] || ''), {
              x: 0.5,
              y: 1.5,
              w: 4.3,
              h: 3.5,
              fontSize: 14,
              color: '333333',
              valign: 'top',
            });
            pptSlide.addText(stripHtml(parts[1] || ''), {
              x: 5.2,
              y: 1.5,
              w: 4.3,
              h: 3.5,
              fontSize: 14,
              color: '333333',
              valign: 'top',
            });
          }
          break;

        default: // content layout
          if (slide.title) {
            pptSlide.addText(slide.title, {
              x: 0.5,
              y: 0.7,
              w: 9,
              h: 0.6,
              fontSize: 28,
              bold: true,
              color: primaryColor.replace('#', ''),
            });
          }
          if (slide.content) {
            pptSlide.addText(stripHtml(slide.content), {
              x: 0.5,
              y: 1.5,
              w: 9,
              h: 3.5,
              fontSize: 16,
              color: '333333',
              valign: 'top',
              bullet: slide.content.includes('•') || slide.content.includes('-'),
            });
          }
      }
    }
  }

  // Sections to slides
  if (data.content.sections) {
    for (const section of data.content.sections) {
      const slide = pptx.addSlide({ masterName: 'WEWINBID_MASTER' });

      slide.addText(section.title, {
        x: 0.5,
        y: 0.7,
        w: 9,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: primaryColor.replace('#', ''),
      });

      slide.addText(stripHtml(section.content), {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 3.5,
        fontSize: 14,
        color: '333333',
        valign: 'top',
      });
    }
  }

  // Generate buffer
  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return buffer as Buffer;
}

// Main export handler
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parse and validate
    const body = await req.json();
    const validation = ExportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (data.format) {
      case 'pdf':
        buffer = await generatePDF(data);
        contentType = 'application/pdf';
        extension = 'pdf';
        break;

      case 'pptx':
        buffer = await generatePPTX(data);
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        extension = 'pptx';
        break;

      case 'docx':
        // For DOCX, we'll use PDF for now (could add docx library later)
        buffer = await generatePDF(data);
        contentType = 'application/pdf';
        extension = 'pdf';
        break;

      default:
        return NextResponse.json({ error: 'Format non supporté' }, { status: 400 });
    }

    // Generate filename
    const sanitizedTitle = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    const filename = `wewinbid-${sanitizedTitle}-${Date.now()}.${extension}`;

    // Return file (convert Buffer to Uint8Array for NextResponse compatibility)
    const uint8Array = new Uint8Array(buffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export' },
      { status: 500 }
    );
  }
}
