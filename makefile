.PHONY: clear-screen compress

ROOT_DIR := lib
TOP_LEVEL := $(shell find $(BUILD_DIR) -name '*.js')
MIN := uglifyjs -o

clear-screen:
	@clear

compress: $(TOP_LEVEL)
	make clear-screen
	@echo "Compressing all JS files $(ROOT_DIR) ...\n\n"
	@$(foreach file, $(wildcard $(ROOT_DIR)/*.js), echo "\n + Compressing $(file)"; $(MIN) $(file) -- $(file);)
	@echo 
	@echo "All files compressed!"
	@exit 0
