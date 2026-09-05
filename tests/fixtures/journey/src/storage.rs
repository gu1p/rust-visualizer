//! Persistence boundary.
pub async fn persist(value: i64) -> Result<i64, &'static str> { Ok(value) }

pub struct Store { pub count: usize }
pub trait Repository { fn count(&self) -> usize; }
impl Repository for Store { fn count(&self) -> usize { self.count } }
