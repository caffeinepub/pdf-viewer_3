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
export interface Image {
    blob: ExternalBlob;
    filename: string;
    uploadedAt: Time;
}
export type Time = bigint;
export interface backendInterface {
    clearImages(): Promise<void>;
    getImages(): Promise<Array<Image>>;
    setImages(blobList: Array<ExternalBlob>, filenameList: Array<string>): Promise<void>;
}
