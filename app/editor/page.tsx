import { StackIconsEditor } from "../_components/StackIconsEditor";
import { getStackIconsEditorInitialState } from "../_components/StackIconsEditor/state";

type SearchParams = Record<string, string | string[] | undefined>;

type EditorProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function Editor({ searchParams }: EditorProps = {}) {
  const resolvedSearchParams = await searchParams;
  const initialEditorState = getStackIconsEditorInitialState(
    resolvedSearchParams ?? {},
  );

  return (
    <main className="mx-auto w-full max-w-[960px] flex-1 bg-background px-6 pb-24 pt-[26px]">
      <StackIconsEditor initialState={initialEditorState} />
    </main>
  );
}
