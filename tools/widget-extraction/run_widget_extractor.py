from WidgetExtractor import WidgetExtractor

if __name__ == "__main__":
    input_dir = r"tools\widget-extraction\sample_widget_images"

    extractor = WidgetExtractor(input_dir, enable_advanced_processing=True)
    dev_output_dir = "widgets_smooth_corners_dev"
    extractor.extract_dev(dev_output_dir)

    extractor_fast = WidgetExtractor(input_dir, enable_advanced_processing=False)
    formal_output_dir = "widgets_basic_output"
    extractor_fast.extract_formal(formal_output_dir)

    extractor.extract_single_image("IMG_4337.png", "test_smooth_corners")

    extractor.extract_formal("widgets_with_smooth_corners")
