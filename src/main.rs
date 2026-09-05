//! Command-line entry point for portable analysis and visualization.
use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use rust_visualizer::{ai::ProviderConfig, analyze, export_html, server};
use std::{path::PathBuf, process::Command};

const VERSION: &str = match option_env!("RV_VERSION") {
    Some(version) => version,
    None => env!("CARGO_PKG_VERSION"),
};

#[derive(Parser)]
#[command(name = "rust-visualizer", version = VERSION, about = "Explore arquitetura e fluxo de código Rust")]
struct Cli {
    #[command(subcommand)]
    command: Option<Action>,
}

#[derive(Subcommand)]
enum Action {
    /// Serve the local graph explorer with optional AI.
    #[command(about = "Abre a interface local com exploração de grafos e IA opcional")]
    Serve {
        /// Repository directory to analyze.
        #[arg(default_value = ".", help = "Diretório do repositório")]
        path: PathBuf,
        /// Local port, with zero requesting an available port.
        #[arg(
            long,
            default_value_t = 0,
            help = "Porta local (0 escolhe uma porta livre)"
        )]
        port: u16,
        /// Disable automatic browser opening.
        #[arg(long, help = "Não abrir o navegador automaticamente")]
        no_open: bool,
    },
    /// Export a self-contained offline architecture snapshot.
    #[command(about = "Gera um ARCHITECTURE.html completo que funciona offline")]
    Export {
        /// Repository directory to analyze.
        #[arg(default_value = ".", help = "Diretório do repositório")]
        path: PathBuf,
        /// Output HTML path; existing files require force.
        #[arg(
            short,
            long,
            default_value = "ARCHITECTURE.html",
            help = "Arquivo HTML de destino"
        )]
        output: PathBuf,
        /// Allow replacing an existing output file.
        #[arg(long, help = "Substituir o arquivo de destino se ele já existir")]
        force: bool,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    match Cli::parse().command.unwrap_or(Action::Serve {
        path: ".".into(),
        port: 0,
        no_open: false,
    }) {
        Action::Serve {
            path,
            port,
            no_open,
        } => serve(path, port, no_open).await,
        Action::Export {
            path,
            output,
            force,
        } => {
            use std::io::Write;
            let html = export_html(&analyze(&path)?);
            let mut options = std::fs::OpenOptions::new();
            options.write(true);
            if force {
                options.create(true).truncate(true);
            } else {
                options.create_new(true);
            }
            let mut file = options.open(&output).context(
                "Não foi possível criar o HTML; use --force para substituir um arquivo existente",
            )?;
            file.write_all(html.as_bytes())?;
            println!("Gerado: {}", output.display());
            Ok(())
        }
    }
}

async fn serve(path: PathBuf, port: u16, no_open: bool) -> Result<()> {
    let graph = analyze(&path)?;
    println!(
        "{}: {} arquivos, {} nós",
        graph.name,
        graph.file_count,
        graph.nodes.len()
    );
    let config = ProviderConfig::from_lookup(|key| std::env::var(key).ok())?;
    if config.is_some() {
        println!("IA habilitada: perguntas enviam trechos relevantes ao provedor configurado.");
    }
    let listener = tokio::net::TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, port)).await?;
    let url = format!("http://{}", listener.local_addr()?);
    println!("{url} · Ctrl/Cmd+K para conversar com IA · Ctrl+C para sair");
    if !no_open {
        open_browser(&url);
    }
    axum::serve(
        listener,
        server::router(graph, config, uuid::Uuid::new_v4().to_string()),
    )
    .with_graceful_shutdown(async {
        let _ = tokio::signal::ctrl_c().await;
    })
    .await?;
    Ok(())
}

fn open_browser(url: &str) {
    let command = if cfg!(target_os = "macos") {
        "open"
    } else {
        "xdg-open"
    };
    if Command::new(command).arg(url).spawn().is_err() {
        eprintln!("Abra o endereço acima no navegador.");
    }
}
