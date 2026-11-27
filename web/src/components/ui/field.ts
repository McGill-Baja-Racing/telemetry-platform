import type { InjectionKey } from "vue";

/** The id that UiFormRow gives its field, so that its label names the field it wraps. */
export const fieldId: InjectionKey<string> = Symbol("fieldId");
