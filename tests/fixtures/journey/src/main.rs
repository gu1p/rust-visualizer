//! A tiny order pipeline that makes control-flow differences observable.
mod storage;
use storage::persist as save;

/// Validate, transform, and persist an order.
pub async fn process(amount: i64) -> Result<i64, &'static str> {
    if amount < 0 {
        return Err("negative");
    }
    let total = normalize(amount);
    let saved = save(total).await?;
    match saved {
        0 => Ok(0),
        value => Ok(value),
    }
}

fn normalize(amount: i64) -> i64 {
    let mut total = 0;
    for i in 0..amount {
        if i == 2 { continue; }
        if i == 10 { break; }
        total += i;
    }
    total
}

fn main() {
    let _future = process(42);
}
