import Time "mo:core/Time";
import List "mo:core/List";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  type Image = {
    blob : Storage.ExternalBlob;
    filename : Text;
    uploadedAt : Time.Time;
  };

  let images = List.empty<Image>();
  var pdf : ?Storage.ExternalBlob = null;

  public shared ({ caller }) func addImage(blob : Storage.ExternalBlob, filename : Text) : async () {
    let image : Image = {
      blob;
      filename;
      uploadedAt = Time.now();
    };
    images.add(image);
  };

  public query ({ caller }) func getAllImages() : async [Image] {
    images.toArray();
  };

  public shared ({ caller }) func removeImage(index : Nat) : async () {
    if (index >= images.size()) { return };
    let imagesArray = images.toArray();
    images.clear();
    var i = 0;
    while (i < imagesArray.size()) {
      if (i != index) {
        images.add(imagesArray[i]);
      };
      i += 1;
    };
  };

  public shared ({ caller }) func clearAllImages() : async () {
    images.clear();
  };

  public shared ({ caller }) func setPdf(blob : Storage.ExternalBlob) : async () {
    pdf := ?blob;
  };

  public query ({ caller }) func getPdf() : async ?Storage.ExternalBlob {
    pdf;
  };

  public shared ({ caller }) func clearPdf() : async () {
    pdf := null;
  };
};
