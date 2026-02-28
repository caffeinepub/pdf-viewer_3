import List "mo:core/List";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";

module {
  type Pdf = {
    blob : Storage.ExternalBlob;
    filename : Text;
    uploadedAt : Time.Time;
  };

  type OldComponent = {
    currentPdf : ?Pdf;
  };

  type Image = {
    blob : Storage.ExternalBlob;
    filename : Text;
    uploadedAt : Time.Time;
  };

  type NewComponent = {
    images : List.List<Image>;
  };

  // Migration function to convert old state with ?Pdf to new state with empty image list
  public func run(_old : OldComponent) : NewComponent {
    { images = List.empty<Image>() };
  };
};
