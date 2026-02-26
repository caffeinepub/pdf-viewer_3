import List "mo:core/List";
import Time "mo:core/Time";
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

  public shared ({ caller }) func setImages(blobList : [Storage.ExternalBlob], filenameList : [Text]) : async () {
    images.clear();

    let minLength = if (blobList.size() < filenameList.size()) { blobList.size() } else {
      filenameList.size();
    };

    for (i in blobList.keys()) {
      if (i < minLength) {
        let image : Image = {
          blob = blobList[i];
          filename = filenameList[i];
          uploadedAt = Time.now();
        };
        images.add(image);
      };
    };
  };

  public query ({ caller }) func getImages() : async [Image] {
    images.toArray();
  };

  public shared ({ caller }) func clearImages() : async () {
    images.clear();
  };
};
