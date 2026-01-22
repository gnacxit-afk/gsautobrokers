
'use client';

import { useParams } from "next/navigation";

export default function CoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;

  return (
    <div>
      <h1 className="text-2xl font-bold">Course Details</h1>
      <p className="text-muted-foreground">Viewing course: {courseId}</p>
      {/* Course details, modules, and lessons will be listed here */}
    </div>
  );
}

    