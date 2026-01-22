
'use client';

import { useParams } from "next/navigation";

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  return (
    <div>
      <h1 className="text-2xl font-bold">Lesson Viewer</h1>
      <p className="text-muted-foreground">Viewing lesson: {lessonId}</p>
      {/* Interactive video player and quizzes will go here */}
    </div>
  );
}

    