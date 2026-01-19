import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors';
import { 
  sanitizeFileName, 
  sanitizeText, 
  isValidUuid,
  checkUploadRateLimit,
  isAllowedFileExtension,
  hasMaliciousPatterns,
} from '@/lib/sanitize';
import { hasFeatureAccess } from '@/lib/subscription';
import { z } from 'zod';

// File validation constants
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_NAME_LENGTH = 255;

// Validation schemas
const DocumentQuerySchema = z.object({
  category: z.enum(['TECHNICAL', 'FINANCIAL', 'LEGAL', 'ADMINISTRATIVE', 'OTHER']).optional(),
  tender_id: z.string().uuid().optional(),
  status: z.enum(['VALID', 'EXPIRED', 'PENDING']).optional(),
});

const UpdateDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  category: z.enum(['TECHNICAL', 'FINANCIAL', 'LEGAL', 'ADMINISTRATIVE', 'OTHER']).optional(),
  status: z.enum(['VALID', 'EXPIRED', 'PENDING']).optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

// GET /api/documents - List documents
async function getHandler(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 });
  }

  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const params = DocumentQuerySchema.parse({
    category: searchParams.get('category') || undefined,
    tender_id: searchParams.get('tender_id') || undefined,
    status: searchParams.get('status') || undefined,
  });
  const { category, tender_id, status } = params;

  let query = supabase
    .from('documents')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }
  if (tender_id) {
    query = query.eq('tender_id', tender_id);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data: documents, error } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }

  return NextResponse.json({ documents });
}

// POST /api/documents - Upload a document
async function postHandler(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 });
  }

  // ✅ RATE LIMITING - Max 10 uploads per minute per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown';
  
  if (!checkUploadRateLimit(ip)) {
    return NextResponse.json({ 
      error: 'Too many uploads. Please wait before uploading more files.' 
    }, { status: 429 });
  }

  // Parse and validate form data
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // ✅ VALIDATION DE LA TAILLE DU NOM DE FICHIER
  if (file.name.length > MAX_FILE_NAME_LENGTH) {
    return NextResponse.json({ 
      error: `File name too long. Maximum ${MAX_FILE_NAME_LENGTH} characters.` 
    }, { status: 400 });
  }

  // ✅ SANITIZATION DU NOM DE FICHIER (protection contre directory traversal)
  const sanitizedOriginalName = sanitizeFileName(file.name);
  
  const FormDataSchema = z.object({
    name: z.string().min(1).max(255).transform(val => sanitizeText(val)),
    category: z.enum(['TECHNICAL', 'FINANCIAL', 'LEGAL', 'ADMINISTRATIVE', 'OTHER']).default('OTHER'),
    tender_id: z.string().uuid().nullable().optional().refine(
      val => !val || isValidUuid(val), 
      { message: 'Invalid tender ID format' }
    ),
    expires_at: z.string().datetime().nullable().optional(),
  });
  
  const data = FormDataSchema.parse({
    name: formData.get('name') || sanitizedOriginalName,
    category: formData.get('category') || 'OTHER'),
    tender_id: formData.get('tender_id') || null,
    expires_at: formData.get('expires_at') || null,
  });

  // ✅ VALIDATION DU TYPE MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ 
      error: 'Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG',
      allowedTypes: ALLOWED_TYPES,
    }, { status: 400 });
  }

  // ✅ VALIDATION DE L'EXTENSION (double check)
  if (!isAllowedFileExtension(sanitizedOriginalName, ALLOWED_EXTENSIONS)) {
    return NextResponse.json({ 
      error: 'Invalid file extension. Allowed: ' + ALLOWED_EXTENSIONS.join(', '),
    }, { status: 400 });
  }

  // ✅ VALIDATION DE LA TAILLE
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ 
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      maxSize: MAX_FILE_SIZE,
      receivedSize: file.size,
    }, { status: 400 });
  }

  // ✅ SCAN DU CONTENU (patterns malveillants)
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  if (hasMaliciousPatterns(fileBuffer)) {
    console.warn(`Malicious pattern detected in file upload from user ${user.id}`);
    return NextResponse.json({ 
      error: 'File rejected: suspicious content detected' 
    }, { status: 400 });
  }

  // Generate unique file path with company isolation
  const fileExt = sanitizedOriginalName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileName = `${profile.company_id}/${timestamp}-${randomId}.${fileExt}`;

  // Upload to Supabase Storage with security headers
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, fileBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false, // Prevent overwriting existing files
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }

  // Get public URL (Supabase handles access control via RLS)
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  // Create document record with sanitized data
  const { data: document, error: dbError } = await supabase
    .from('documents')
    .insert({
      company_id: profile.company_id,
      tender_id: data.tender_id,
      name: data.name,
      file_name: sanitizedOriginalName,
      file_type: file.type,
      file_size: file.size,
      file_path: fileName,
      url: publicUrl,
      category: data.category,
      status: 'VALID',
      expires_at: data.expires_at,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error:', dbError);
    // Rollback: delete uploaded file
    await supabase.storage.from('documents').remove([fileName]);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }

  // ✅ AUDIT LOG
  console.info(`Document uploaded: ${document.id} by user ${user.id} (company: ${profile.company_id})`);

  return NextResponse.json({ document }, { status: 201 });
}

// PUT /api/documents - Update document metadata
async function putHandler(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 });
  }

  // Parse and validate request body
  const body = await request.json();
  const { id, ...updateData } = UpdateDocumentSchema.parse(body);

  // Update document
  const { data: document, error } = await supabase
    .from('documents')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .select()
    .single();

  if (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }

  return NextResponse.json({ document });
}

// DELETE /api/documents - Delete a document
async function deleteHandler(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 });
  }

  // Parse and validate document ID
  const { searchParams } = new URL(request.url);
  const id = z.string().uuid().parse(searchParams.get('id'));

  // Get document to find file path
  const { data: document } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single();

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Delete from storage
  if (document.file_path) {
    await supabase.storage
      .from('documents')
      .remove([document.file_path]);
  }

  // Delete from database
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id);

  if (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Export wrapped handlers
export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
