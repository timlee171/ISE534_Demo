import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from google.colab import drive
import os
from datetime import timedelta

# Set style for visualizations
plt.style.use('ggplot')
sns.set_palette("colorblind")

# Conversion factor: 1 cycle = 24 hours (adjust if needed)
CYCLE_TO_HOUR_FACTOR = 24.0

# Function to load and preprocess data
def load_and_preprocess_data(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(
            f"File not found at {file_path}. Please upload 'remaining_useful_life.csv' to your Google Drive 'MyDrive' folder."
        )

    # Read CSV with all columns
    df = pd.read_csv(file_path, low_memory=True)

    # Define expected columns
    expected_columns = [
        'machineID', 'datetime', 'time_in_cycles', 'voltmean_24h', 'rotatemean_24h',
        'pressuremean_24h', 'vibrationmean_24h', 'voltsd_24h', 'rotatesd_24h',
        'pressuresd_24h', 'vibrationsd_24h', 'voltmean_5d', 'rotatemean_5d',
        'pressuremean_5d', 'vibrationmean_5d', 'voltsd_5d', 'rotatesd_5d',
        'pressuresd_5d', 'vibrationsd_5d', 'error1', 'error2', 'error3', 'error4',
        'error5', 'comp1', 'comp2', 'comp3', 'comp4', 'model', 'age', 'DI',
        'RULWeek', 'failure', 'failed', 'RUL', 'RUL_I'
    ]

    # Add missing columns with defaults
    for col in expected_columns:
        if col not in df.columns:
            df[col] = 0 if col in ['error1', 'error2', 'error3', 'error4', 'error5',
                                   'comp1', 'comp2', 'comp3', 'comp4', 'age',
                                   'time_in_cycles', 'RUL', 'RUL_I', 'failed',
                                   'DI', 'RULWeek'] else 'none' if col == 'failure' else np.nan

    # Convert numeric columns
    numeric_cols = [
        'time_in_cycles', 'voltmean_24h', 'rotatemean_24h', 'pressuremean_24h',
        'vibrationmean_24h', 'voltsd_24h', 'rotatesd_24h', 'pressuresd_24h',
        'vibrationsd_24h', 'voltmean_5d', 'rotatemean_5d', 'pressuremean_5d',
        'vibrationmean_5d', 'voltsd_5d', 'rotatesd_5d', 'pressuresd_5d',
        'vibrationsd_5d', 'error1', 'error2', 'error3', 'error4', 'error5',
        'comp1', 'comp2', 'comp3', 'comp4', 'age', 'DI', 'RULWeek', 'failed',
        'RUL', 'RUL_I'
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce', downcast='float')

    # Convert datetime
    df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')

    # Debug: Check data before filtering
    print("Initial dataset shape:", df.shape)
    print("Missing values in critical columns:")
    print(df[['machineID', 'datetime', 'RUL']].isna().sum())
    print("Failed column values:", df['failed'].value_counts(dropna=False))
    print("RUL values summary:", df['RUL'].describe())

    # Less strict filtering: Keep rows with at least one valid critical column
    df = df.dropna(subset=['machineID', 'datetime', 'RUL'], how='all')  # Drop only if all are missing
    df = df[df['RUL'].notna()]  # Ensure RUL is not NaN

    # Debug: Check data after filtering
    print("Dataset shape after filtering:", df.shape)
    print("Columns available:", df.columns.tolist())

    if df.empty:
        raise ValueError("No valid data remains after preprocessing. Check 'machineID', 'datetime', and 'RUL' columns for missing or invalid data.")

    # Convert RUL to hours
    df['RUL_hours'] = df['RUL'] * CYCLE_TO_HOUR_FACTOR

    # Encode categorical variable 'model'
    df['model'] = df['model'].fillna('unknown')
    le = LabelEncoder()
    df['model_encoded'] = le.fit_transform(df['model'])

    return df, le

# Function to infer failure reason
def infer_failure_reason(row):
    errors = ['error1', 'error2', 'error3', 'error4', 'error5']
    active_errors = [err for err in errors if err in row and row[err] > 0]
    if active_errors:
        return f"Error codes: {', '.join(active_errors)}"

    comps = ['comp1', 'comp2', 'comp3', 'comp4']
    active_comps = [comp for comp in comps if comp in row and row[comp] > 0]
    if active_comps:
        return f"Maintenance on: {', '.join([c.replace('comp', 'component ') for c in active_comps])}"

    if 'vibrationmean_24h' in row and row['vibrationmean_24h'] > 45:
        return "High vibration"
    if 'voltmean_24h' in row and row['voltmean_24h'] > 180:
        return "High voltage"
    if 'pressuremean_24h' in row and row['pressuremean_24h'] > 110:
        return "High pressure"
    if 'rotatemean_24h' in row and row['rotatemean_24h'] > 500:
        return "High rotation speed"
    return "Unknown or general wear"

# Train XGBoost model and make predictions
def train_and_predict(df):
    features = [
        'time_in_cycles', 'voltmean_24h', 'rotatemean_24h', 'pressuremean_24h',
        'vibrationmean_24h', 'voltsd_24h', 'rotatesd_24h', 'pressuresd_24h',
        'vibrationsd_24h', 'voltmean_5d', 'rotatemean_5d', 'pressuremean_5d',
        'vibrationmean_5d', 'voltsd_5d', 'rotatesd_5d', 'pressuresd_5d',
        'vibrationsd_5d', 'error1', 'error2', 'error3', 'error4', 'error5',
        'comp1', 'comp2', 'comp3', 'comp4', 'age', 'model_encoded', 'DI'
    ]

    # Ensure all features exist in df; exclude missing columns
    available_features = [f for f in features if f in df.columns]
    if not available_features:
        raise ValueError("No valid features available in the dataset. Check column names.")

    # Debug: Check available features
    print("Available features:", available_features)

    # Use all data for training
    train_df = df.copy()

    # Select features and target
    X = train_df[available_features]
    y = train_df['RUL_hours']

    # Handle missing values
    X = X.fillna(X.mean())  # Impute missing values with column means
    y = y.fillna(y.mean())  # Impute missing RUL_hours

    # Debug: Check shapes and missing values
    print("X shape before training:", X.shape)
    print("y shape before training:", y.shape)
    print("Missing values in X:", X.isna().sum().sum())
    print("Missing values in y:", y.isna().sum())

    # Check if X or y is empty or contains no valid data
    if X.empty or y.empty or X.shape[0] == 0 or y.shape[0] == 0:
        raise ValueError(
            f"No valid training data available. X shape: {X.shape}, y shape: {y.shape}. "
            "Check 'RUL_hours' and feature columns for missing or invalid data."
        )

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Initialize and train model
    model = xgb.XGBRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=6,
        random_state=42,
        objective='reg:squarederror'
    )

    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='neg_mean_squared_error')
    rmse_scores = np.sqrt(-cv_scores)
    print(f"Cross-validation RMSE: {rmse_scores.mean():.2f} ± {rmse_scores.std():.2f} hours")

    # Train and predict
    model.fit(X_train, y_train)
    df['predicted_RUL_hours'] = model.predict(df[available_features].fillna(df[available_features].mean()))

    return model, df

# Visualize results
def visualize_results(model, df):
    plt.figure(figsize=(10, 6))
    xgb.plot_importance(model, max_num_features=10, importance_type='gain')
    plt.title('Feature Importance for RUL Prediction', fontsize=14)
    plt.tight_layout()
    plt.savefig('feature_importance.png', dpi=300)
    plt.show()
    plt.close()

    plt.figure(figsize=(10, 6))
    sns.histplot(df['predicted_RUL_hours'], bins=50, kde=True)
    plt.title('Distribution of Predicted Hours to Failure', fontsize=14)
    plt.xlabel('Predicted Hours to Failure', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.tight_layout()
    plt.savefig('predicted_hours_distribution.png', dpi=300)
    plt.show()
    plt.close()

    sample_machine = df[df['machineID'] == 1].sort_values('datetime')
    if not sample_machine.empty:
        plt.figure(figsize=(12, 6))
        plt.plot(sample_machine['datetime'], sample_machine['RUL_hours'], label='Actual RUL (hours)', alpha=0.7)
        plt.plot(sample_machine['datetime'], sample_machine['predicted_RUL_hours'], label='Predicted RUL (hours)', alpha=0.7)
        plt.title('Actual vs. Predicted RUL for Machine ID 1', fontsize=14)
        plt.xlabel('Date', fontsize=12)
        plt.ylabel('RUL (hours)', fontsize=12)
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.savefig('rul_vs_time_machine1.png', dpi=300)
        plt.show()
        plt.close()

# Generate output CSV
def generate_output_csv(df):
    latest_records = df.sort_values('datetime').groupby('machineID').last().reset_index()
    latest_records['hours_to_failure'] = latest_records['predicted_RUL_hours'].clip(lower=0)
    latest_records['predicted_failure_time'] = latest_records['datetime'] + pd.to_timedelta(latest_records['hours_to_failure'], unit='h')
    latest_records['reason_for_failure'] = latest_records.apply(infer_failure_reason, axis=1)
    output_df = latest_records[['machineID', 'predicted_failure_time', 'hours_to_failure', 'reason_for_failure']]
    output_df.to_csv('machine_failure_predictions.csv', index=False)
    return output_df

# Main execution
def main():
    # Mount Google Drive
    print("Mounting Google Drive...")
    drive.mount('/content/drive')

    # Specify the path to your CSV in Google Drive
    file_path = '/content/drive/MyDrive/remaining_useful_life.csv'

    if not os.path.exists(file_path):
        raise FileNotFoundError(
            f"File not found at {file_path}. Please upload 'remaining_useful_life.csv' to your Google Drive 'MyDrive' folder."
        )

    print(f"Loading {file_path}...")
    df, le = load_and_preprocess_data(file_path)

    # Debug: Show dataset overview
    print("First few rows of dataset:")
    print(df.head())
    print("Dataset info:")
    print(df.info())

    model, df = train_and_predict(df)
    visualize_results(model, df)
    output_df = generate_output_csv(df)

    print("\nSample of output CSV:")
    print(output_df.head())

    print("\nVisualizations saved as 'feature_importance.png', 'predicted_hours_distribution.png', and 'rul_vs_time_machine1.png'")
    print("Output CSV saved as 'machine_failure_predictions.csv'")
    print("Download files from the Files tab in Colab or from your Google Drive.")

if __name__ == "__main__":
    main()