"use client";

import { useParams } from "next/navigation";
import { WorkoutEditor } from "../workout-editor";

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  return <WorkoutEditor workoutId={params.id} />;
}
