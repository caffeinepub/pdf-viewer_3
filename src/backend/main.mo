import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  include MixinStorage();

  type Pdf = {
    blob : Storage.ExternalBlob;
    filename : Text;
    uploadedAt : Time.Time;
  };

  var currentPdf : ?Pdf = null;

  public shared ({ caller }) func setPdf(blob : Storage.ExternalBlob, filename : Text) : async () {
    let pdf : Pdf = {
      blob;
      filename;
      uploadedAt = Time.now();
    };
    currentPdf := ?pdf;
  };

  public query ({ caller }) func getPdf() : async ?Pdf {
    currentPdf;
  };

  public shared ({ caller }) func clearPdf() : async () {
    currentPdf := null;
  };
};
