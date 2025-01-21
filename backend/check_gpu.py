import tensorflow as tf
import os
import sys

print("Python version:", sys.version)
print("TensorFlow version:", tf.__version__)

# Print CUDA environment variables
print("\nCUDA Environment:")
cuda_vars = ['CUDA_PATH', 'CUDA_HOME', 'LD_LIBRARY_PATH', 'PATH']
for var in cuda_vars:
    print(f"{var}:", os.environ.get(var, 'Not set'))

# Check if CUDA is built into TensorFlow
print("\nTensorFlow CUDA build information:")
print("Built with CUDA:", tf.test.is_built_with_cuda())
print("Built with GPU support:", tf.test.is_built_with_gpu_support())

# List physical devices
print("\nPhysical Devices:")
print("CPU Devices:", tf.config.list_physical_devices('CPU'))
print("GPU Devices:", tf.config.list_physical_devices('GPU'))

# Test GPU availability
if tf.test.gpu_device_name():
    print('\nDefault GPU Device:', tf.test.gpu_device_name())
else:
    print('\nNo GPU device found')

# Test GPU computation if available
if len(tf.config.list_physical_devices('GPU')) > 0:
    print("\nTesting GPU computation...")
    with tf.device('/GPU:0'):
        a = tf.constant([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
        b = tf.constant([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])
        c = tf.matmul(a, b)
        print("Matrix multiplication result:", c.numpy())
else:
    print("\nNo GPU available. Using CPU only.") 