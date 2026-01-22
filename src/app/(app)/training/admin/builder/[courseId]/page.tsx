
'use client';

import { useParams } from "next/navigation";

export default function CourseBuilderPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  return (
    <div>
      <h1 className="text-2xl font-bold">Course Builder</h1>
      <p className="text-muted-foreground">Building course: {courseId}</p>
      {/* Course builder UI will go here */}
    </div>
  );
}

    