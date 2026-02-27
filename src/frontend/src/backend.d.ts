import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface Pdf {
    blob: ExternalBlob;
    filename: string;
    uploadedAt: Time;
}
export interface backendInterface {
    clearPdf(): Promise<void>;
    getPdf(): Promise<Pdf | null>;
    setPdf(blob: ExternalBlob, filename: string): Promise<void>;
}
