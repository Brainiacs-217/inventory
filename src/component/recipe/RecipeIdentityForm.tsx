"use client";

import { RecipeField, recipeInputClassName } from "@/component/recipe/formShared";

type RecipeIdentityFormProps = {
  name: string;
  error?: string;
  onChange: (name: string) => void;
};

export function RecipeIdentityForm({
  name,
  error,
  onChange,
}: RecipeIdentityFormProps) {
  return (
    <RecipeField label="Recipe name" required error={error}>
      <input
        type="text"
        placeholder="e.g. Classic cheeseburger"
        value={name}
        onChange={(event) => onChange(event.target.value)}
        className={recipeInputClassName}
        autoFocus
      />
    </RecipeField>
  );
}
