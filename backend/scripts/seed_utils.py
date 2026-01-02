import pandas as pd
import glob
import os
import logging

logger = logging.getLogger(__name__)

def merge_sparkov_csvs(directory_path: str) -> pd.DataFrame:
    """
    Gather all fragmented Sparkov transaction files into a single DataFrame.
    """
    # Look for all CSVs in the target directory
    csv_files = glob.glob(os.path.join(directory_path, "*.csv"))
    valid_dfs = []

    for file in csv_files:
        # Skip metadata files
        if "customers" in file.lower():
            continue

        # Skip empty files to prevent pandas errors
        if os.path.getsize(file) == 0:
            continue

        try:
            # Sparkov typically uses '|' as a separator
            df = pd.read_csv(file, sep='|')

            # Verify it's actually a transaction file by checking for a known header
            if not df.empty and 'trans_num' in df.columns:
                valid_dfs.append(df)
                logger.info(f"Loaded {len(df)} rows from {os.path.basename(file)}")
        except Exception as e:
            logger.error(f"Error reading {file}: {e}")

    if not valid_dfs:
        raise ValueError(f"No valid transaction data found in {directory_path}")

    return pd.concat(valid_dfs, ignore_index=True)
