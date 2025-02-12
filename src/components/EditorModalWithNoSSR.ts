import dynamic from "next/dynamic";

const EditorModalWithNoSSR = dynamic(() => import("./EditorModal"), {
  ssr: false,
});

export default EditorModalWithNoSSR;
