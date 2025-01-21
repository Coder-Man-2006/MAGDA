# General Libs
from tensorflow import keras
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.inception_resnet_v2 import InceptionResNetV2, preprocess_input
from tensorflow.keras.layers import Dense, Flatten
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.optimizers import Adam
import numpy as np
import random
import matplotlib.pyplot as plt
from PIL import ImageFile
import itertools
from sklearn.metrics import classification_report, confusion_matrix

# Fix error with PIL
ImageFile.LOAD_TRUNCATED_IMAGES = True

# Parameters
im_shape = (224, 224)
TRAINING_DIR = 'FaceShape Dataset/training_set'
TEST_DIR = 'FaceShape Dataset/testing_set'
seed = 10
BATCH_SIZE = 16

# Data generators
data_generator = ImageDataGenerator(
    validation_split=0.2,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    preprocessing_function=preprocess_input,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_data_generator = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.2
)

# Generator for the train part
train_generator = data_generator.flow_from_directory(
    TRAINING_DIR,
    target_size=im_shape,
    shuffle=True,
    seed=seed,
    class_mode='categorical',
    batch_size=BATCH_SIZE,
    subset="training"
)

# Generator for the validation part
validation_generator = val_data_generator.flow_from_directory(
    TRAINING_DIR,
    target_size=im_shape,
    shuffle=False,
    seed=seed,
    class_mode='categorical',
    batch_size=BATCH_SIZE,
    subset="validation"
)

# Generator for the test dataset
test_generator = ImageDataGenerator(preprocessing_function=preprocess_input)
test_generator = test_generator.flow_from_directory(
    TEST_DIR,
    target_size=im_shape,
    shuffle=False,
    seed=seed,
    class_mode='categorical',
    batch_size=BATCH_SIZE
)

def create_model(num_classes):
    base_model = InceptionResNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(im_shape[0], im_shape[1], 3)
    )
    
    x = base_model.output
    x = Flatten()(x)
    x = Dense(200, activation='relu')(x)
    predictions = Dense(num_classes, activation='softmax', kernel_initializer='random_uniform')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    # Freezing pretrained layers
    for layer in base_model.layers:
        layer.trainable = False
    
    optimizer = Adam()
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def plot_training_history(history):
    history_dict = history.history
    loss_values = history_dict['loss']
    val_loss_values = history_dict['val_loss']
    
    epochs_x = range(1, len(loss_values) + 1)
    plt.figure(figsize=(10, 10))
    
    # Plot loss
    plt.subplot(2, 1, 1)
    plt.plot(epochs_x, loss_values, 'bo', label='Training loss')
    plt.plot(epochs_x, val_loss_values, 'b', label='Validation loss')
    plt.title('Training and validation Loss and Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    
    # Plot accuracy
    plt.subplot(2, 1, 2)
    acc_values = history_dict['accuracy']
    val_acc_values = history_dict['val_accuracy']
    plt.plot(epochs_x, acc_values, 'bo', label='Training acc')
    plt.plot(epochs_x, val_acc_values, 'b', label='Validation acc')
    plt.xlabel('Epochs')
    plt.ylabel('Acc')
    plt.legend()
    
    plt.savefig('training_history.png')
    plt.close()

def plot_confusion_matrix(cm, classes, normalize=True, title='Confusion matrix'):
    plt.figure(figsize=(10, 10))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title(title)
    plt.colorbar()
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, rotation=45)
    plt.yticks(tick_marks, classes)
    
    if normalize:
        cm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        cm = np.around(cm, decimals=2)
        cm[np.isnan(cm)] = 0.0
    
    thresh = cm.max() / 2.
    for i, j in itertools.product(range(cm.shape[0]), range(cm.shape[1])):
        plt.text(j, i, cm[i, j],
                horizontalalignment="center",
                color="white" if cm[i, j] > thresh else "black")
    
    plt.tight_layout()
    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    plt.savefig('confusion_matrix.png')
    plt.close()

def main():
    # Get dataset information
    nb_train_samples = train_generator.samples
    nb_validation_samples = validation_generator.samples
    nb_test_samples = test_generator.samples
    classes = list(train_generator.class_indices.keys())
    print('Classes:', classes)
    num_classes = len(classes)
    
    # Create and train model
    model = create_model(num_classes)
    
    # Training parameters
    epochs = 15
    callbacks_list = [
        keras.callbacks.ModelCheckpoint(
            filepath='model.h5',
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            verbose=1
        )
    ]
    
    # Train the model
    print("\nTraining model...")
    history = model.fit(
        train_generator,
        steps_per_epoch=nb_train_samples // BATCH_SIZE,
        epochs=epochs,
        callbacks=callbacks_list,
        validation_data=validation_generator,
        verbose=1,
        validation_steps=nb_validation_samples // BATCH_SIZE
    )
    
    # Plot training history
    plot_training_history(history)
    
    # Load the best model
    model = load_model('model.h5')
    
    # Evaluate on validation set
    print("\nEvaluating on validation set...")
    val_score = model.evaluate(validation_generator)
    print('Validation loss:', val_score[0])
    print('Validation accuracy:', val_score[1])
    
    # Evaluate on test set
    print("\nEvaluating on test set...")
    test_score = model.evaluate(test_generator)
    print('Test loss:', test_score[0])
    print('Test accuracy:', test_score[1])
    
    # Generate predictions and confusion matrix
    print("\nGenerating confusion matrix...")
    Y_pred = model.predict(test_generator)
    y_pred = np.argmax(Y_pred, axis=1)
    
    cm = confusion_matrix(test_generator.classes, y_pred)
    plot_confusion_matrix(cm, classes, normalize=False, title='Confusion Matrix')
    
    print('\nClassification Report:')
    print(classification_report(test_generator.classes, y_pred, target_names=classes))

if __name__ == "__main__":
    main() 