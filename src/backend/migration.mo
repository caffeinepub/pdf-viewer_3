import List "mo:core/List";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    images : List.List<{
      blob : Storage.ExternalBlob;
      filename : Text;
      uploadedAt : Time.Time;
    }>;
  };

  type NewActor = {
    currentPdf : ?{
      blob : Storage.ExternalBlob;
      filename : Text;
      uploadedAt : Time.Time;
    };
  };

  public func run(old : OldActor) : NewActor {
    let imagesArray = old.images.toArray();
    let currentPdf = if (imagesArray.size() > 0) {
      ?imagesArray[0];
    } else {
      null;
    };
    { currentPdf };
  };
};
