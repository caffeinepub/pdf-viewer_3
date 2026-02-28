import List "mo:core/List";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    images : List.List<{ blob : Storage.ExternalBlob; filename : Text; uploadedAt : Int }>;
  };

  type NewActor = {
    images : List.List<{ blob : Storage.ExternalBlob; filename : Text; uploadedAt : Int }>;
    pdf : ?Storage.ExternalBlob;
  };

  public func run(old : OldActor) : NewActor {
    { old with pdf = null };
  };
};
