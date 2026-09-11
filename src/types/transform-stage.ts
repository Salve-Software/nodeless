/**
 * `language` changes what the file is: `.scss` becomes CSS. One of them runs, because a file
 * is written in one language. `content` rewrites inside that language, and they all run.
 */
export type TransformStage = 'language' | 'content';
