import List "mo:core/List";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type OldPdfReference = {
    blob : Storage.ExternalBlob;
    filename : Text;
    uploadedAt : Time.Time;
  };

  type OldActor = {
    currentPdf : ?OldPdfReference;
  };

  type NewImage = {
    blob : Storage.ExternalBlob;
    filename : Text;
    uploadedAt : Time.Time;
  };

  type NewActor = {
    images : List.List<NewImage>;
  };

  public func run(old : OldActor) : NewActor {
    let images = List.empty<NewImage>();
    switch (old.currentPdf) {
      case (?pdf) {
        images.add(pdf);
      };
      case (null) {};
    };
    { images };
  };
};
