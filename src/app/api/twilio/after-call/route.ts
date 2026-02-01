import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    console.log('After-call callback recibido:', Object.fromEntries(formData));
    // Aquí puedes procesar: guardar duración, recordingUrl, etc.
    // Ej: CallStatus=completed, RecordingUrl=..., etc.

    return new NextResponse(null, { status: 204 }); // 204 No Content es ideal para callbacks de status
  } catch (error) {
    console.error('Error en after-call:', error);
    return new NextResponse(null, { status: 204 }); // Aún responde 204 para evitar warnings
  }
}
