//! Compile the protobuf contract; UI assets are built before Cargo runs.
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut config = prost_build::Config::new();
    config.protoc_executable(protoc_bin_vendored::protoc_bin_path()?);
    config.compile_protos(&["proto/graph.proto"], &["proto"])?;
    println!("cargo:rerun-if-changed=proto/graph.proto");
    println!("cargo:rerun-if-changed=dist");
    println!("cargo:rerun-if-env-changed=RV_VERSION");
    Ok(())
}
